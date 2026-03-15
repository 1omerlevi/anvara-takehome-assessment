import { Router, type Request, type Response, type IRouter } from 'express';
import { prisma } from '../db.js';
import { getParam } from '../utils/helpers.js';
import { authMiddleware, roleMiddleware, type AuthRequest } from '../auth.js';

const router: IRouter = Router();

//sponsor-only route group + authenticated access
router.use(authMiddleware, roleMiddleware(['SPONSOR']));


// GET /api/campaigns - List all campaigns
// only current sponsor's campaigns
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const sponsorId = req.user?.sponsorId;
    if (!sponsorId) return void res.status(403).json({ error: 'Forbidden' });

  // User-scoped data access (only own campaigns)
  const campaigns = await prisma.campaign.findMany({
    where: {
      // Requirement: user-scoped data access
      sponsorId,
      ...(status && { status: status as 'ACTIVE' | 'PAUSED' | 'COMPLETED' }),
    },
    include: {
      sponsor: { select: { id: true, name: true, logo: true } },
      _count: { select: { creatives: true, placements: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});


// GET /api/campaigns/:id - Get single campaign with details
// with ownership check
/*
401 if not authenticated
403 if authenticated but missing sponsor access for this route
404 if the campaign does not exist, or exists but belongs to another sponsor
200 if fetch succeeds
*/
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const sponsorId = req.user?.sponsorId;
    if (!sponsorId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const id = getParam(req.params.id);
    const campaign = await prisma.campaign.findUnique({
      where: { id, sponsorId }, // Ownership is checked in the Prisma query itself
      include: {
        sponsor: true,
        creatives: true,
        placements: {
          include: {
            adSlot: true,
            publisher: { select: { id: true, name: true, category: true } },
          },
        },
      },
    });

    // 404 when resource doesn't exist or is not owned by this sponsor
    if (!campaign) {
      return void res.status(404).json({ error: 'Campaign not found' });
    }

    res.status(200).json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// POST /api/campaigns - Create new campaign
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const sponsorId = req.user?.sponsorId;
    if (!sponsorId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const {
      name,
      description,
      budget,
      cpmRate,
      cpcRate,
      startDate,
      endDate,
      targetCategories,
      targetRegions,
    } = req.body;

    if (!name || !budget || !startDate || !endDate || !sponsorId) {
      res.status(400).json({
        error: 'Name, budget, startDate, and endDate are required',
      });
      return;
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        budget,
        cpmRate,
        cpcRate,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        targetCategories: targetCategories || [],
        targetRegions: targetRegions || [],
        //force ownership from authenticated user
        sponsorId,
      },
      include: {
        sponsor: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// PUT /api/campaigns/:id - Update campaign details
/*
Validates editable fields before update.
Uses ownership-scoped lookup before modifying.
Returns 400 for bad input, 404 if missing/not owned, and 200 on success.
*/
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const sponsorId = req.user?.sponsorId;
    if (!sponsorId) return void res.status(403).json({ error: 'Forbidden' });

    const id = getParam(req.params.id);
    const { name, description, budget, cpmRate, cpcRate, startDate, endDate, status, targetCategories, targetRegions } = req.body;

    const validStatuses = ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'] as const;
    const data: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return void res.status(400).json({ error: 'Invalid name' });
      }
      data.name = name.trim();
    }

    if (description !== undefined) {
      if (description !== null && typeof description !== 'string') {
        return void res.status(400).json({ error: 'Invalid description' });
      }
      data.description = description;
    }

    if (budget !== undefined) {
      const parsedBudget = Number(budget);
      if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
        return void res.status(400).json({ error: 'Invalid budget' });
      }
      data.budget = parsedBudget;
    }

    if (cpmRate !== undefined) {
      const parsedCpmRate = Number(cpmRate);
      if (!Number.isFinite(parsedCpmRate) || parsedCpmRate < 0) {
        return void res.status(400).json({ error: 'Invalid cpmRate' });
      }
      data.cpmRate = parsedCpmRate;
    }

    if (cpcRate !== undefined) {
      const parsedCpcRate = Number(cpcRate);
      if (!Number.isFinite(parsedCpcRate) || parsedCpcRate < 0) {
        return void res.status(400).json({ error: 'Invalid cpcRate' });
      }
      data.cpcRate = parsedCpcRate;
    }

    if (startDate !== undefined) {
      const parsedStartDate = new Date(startDate);
      if (Number.isNaN(parsedStartDate.getTime())) {
        return void res.status(400).json({ error: 'Invalid startDate' });
      }
      data.startDate = parsedStartDate;
    }

    if (endDate !== undefined) {
      const parsedEndDate = new Date(endDate);
      if (Number.isNaN(parsedEndDate.getTime())) {
        return void res.status(400).json({ error: 'Invalid endDate' });
      }
      data.endDate = parsedEndDate;
    }

    if (status !== undefined) {
      if (typeof status !== 'string' || !validStatuses.includes(status as (typeof validStatuses)[number])) {
        return void res.status(400).json({ error: 'Invalid status' });
      }
      data.status = status;
    }

    if (targetCategories !== undefined) {
      if (!Array.isArray(targetCategories) || !targetCategories.every((value) => typeof value === 'string')) {
        return void res.status(400).json({ error: 'Invalid targetCategories' });
      }
      data.targetCategories = targetCategories;
    }

    if (targetRegions !== undefined) {
      if (!Array.isArray(targetRegions) || !targetRegions.every((value) => typeof value === 'string')) {
        return void res.status(400).json({ error: 'Invalid targetRegions' });
      }
      data.targetRegions = targetRegions;
    }

    if (Object.keys(data).length === 0) {
      return void res.status(400).json({ error: 'No valid fields provided' });
    }

    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        id,
        sponsorId,
      },
    });

    if (!existingCampaign) {
      return void res.status(404).json({ error: 'Campaign not found' });
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data,
      include: {
        sponsor: { select: { id: true, name: true } },
      },
    });

    res.status(200).json(updatedCampaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});


// DELETE /api/campaigns/:id - Delete campaign
/*
Verifies ownership before delete.
404 if the campaign is missing or not owned.
204 No Content on success.
*/
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const sponsorId = req.user?.sponsorId;
    if (!sponsorId) return void res.status(403).json({ error: 'Forbidden' });

    const id = getParam(req.params.id);
    const existingCampaign = await prisma.campaign.findFirst({ where: { id, sponsorId } });

    // 404 if resource does not exist or is not owned by this sponsor
    if (!existingCampaign) return void res.status(404).json({ error: 'Campaign not found' });

    await prisma.campaign.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});


// Update campaign details (name, budget, dates, status, etc.)

export default router;
