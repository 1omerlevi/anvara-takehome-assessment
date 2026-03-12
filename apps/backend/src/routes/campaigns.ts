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
//with ownership check
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const sponsorId = req.user?.sponsorId;
    if (!sponsorId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const id = getParam(req.params.id);
    const campaign = await prisma.campaign.findUnique({
      where: { id },
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

      //404 when resource doesn't exist:
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }
      //403 when accessing another user's data:
    if (campaign.sponsorId !== req.user?.sponsorId) {
      return void res.status(403).json({ error: 'Forbidden' });
    }

    res.json(campaign);
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
        error: 'Name, budget, startDate, endDate, and sponsorId are required',
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

// TODO: Add PUT /api/campaigns/:id endpoint

// PUT /api/campaigns/:id - Update campaign details
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const sponsorId = req.user?.sponsorId;
    if (!sponsorId) return void res.status(403).json({ error: 'Forbidden' });

    const id = getParam(req.params.id);
    const existingCampaign = await prisma.campaign.findUnique({ where: { id } });

    // Requirement: 404 if resource does not exist
    if (!existingCampaign) return void res.status(404).json({ error: 'Campaign not found' });

    // Requirement: 403 if user does not own resource
    if (existingCampaign.sponsorId !== sponsorId) {
      return void res.status(403).json({ error: 'Forbidden' });
    }

    const { name, description, budget, cpmRate, cpcRate, startDate, endDate, status } = req.body;

    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(budget !== undefined && { budget }),
        ...(cpmRate !== undefined && { cpmRate }),
        ...(cpcRate !== undefined && { cpcRate }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(status !== undefined && { status }),
      },
      include: {
        sponsor: { select: { id: true, name: true } },
      },
    });

    res.json(updatedCampaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// DELETE /api/campaigns/:id - Delete campaign
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const sponsorId = req.user?.sponsorId;
    if (!sponsorId) return void res.status(403).json({ error: 'Forbidden' });

    const id = getParam(req.params.id);
    const existingCampaign = await prisma.campaign.findUnique({ where: { id } });

    // Requirement: 404 if resource does not exist
    if (!existingCampaign) return void res.status(404).json({ error: 'Campaign not found' });

    // Requirement: 403 if user does not own resource
    if (existingCampaign.sponsorId !== sponsorId) {
      return void res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.campaign.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});


// Update campaign details (name, budget, dates, status, etc.)

export default router;
