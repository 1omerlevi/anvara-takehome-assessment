import { Router, type Request, type Response, type IRouter } from 'express';
import { prisma } from '../db.js';
import { getParam } from '../utils/helpers.js';
import { authMiddleware, roleMiddleware, type AuthRequest } from '../auth.js';

const router: IRouter = Router();
const adSlotTypes = ['DISPLAY', 'VIDEO', 'NATIVE', 'NEWSLETTER', 'PODCAST'] as const;

// GET /api/ad-slots - List available ad slots
// Only current publisher's 
router.get('/', authMiddleware, roleMiddleware(['PUBLISHER']), async (req: AuthRequest, res: Response) => {
  try {
    const { type, available } = req.query;
    const publisherId = req.user?.publisherId;
    if (!publisherId) return void res.status(403).json({ error: 'Forbidden' });

    const adSlots = await prisma.adSlot.findMany({
      where: { //user-scoped data access
        publisherId,
        ...(type && {
          type: type as string as 'DISPLAY' | 'VIDEO' | 'NATIVE' | 'NEWSLETTER' | 'PODCAST',
        }),
        ...(available === 'true' && { isAvailable: true }),
      },
      include: {
        publisher: { select: { id: true, name: true, category: true, monthlyViews: true } },
        _count: { select: { placements: true } },
      },
      orderBy: { basePrice: 'desc' },
    });

    res.json(adSlots);
  } catch (error) {
    console.error('Error fetching ad slots:', error);
    res.status(500).json({ error: 'Failed to fetch ad slots' });
  }
});

// Public marketplace list (no auth)
router.get('/public', async (req: Request, res: Response) => {
  try {
    const { type, available } = req.query;

    const adSlots = await prisma.adSlot.findMany({
      where: {
        ...(type && { type: type as 'DISPLAY' | 'VIDEO' | 'NATIVE' | 'NEWSLETTER' | 'PODCAST' }),
        ...(available === 'true' ? { isAvailable: true } : {}),
      },
      include: {
        publisher: { select: { id: true, name: true, category: true, monthlyViews: true } },
        _count: { select: { placements: true } },
      },
      orderBy: { basePrice: 'desc' },
    });

    res.json(adSlots);
  } catch (error) {
    console.error('Error fetching marketplace ad slots:', error);
    res.status(500).json({ error: 'Failed to fetch ad slots' });
  }
});

// Public marketplace detail (no auth)
router.get('/public/:id', async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const adSlot = await prisma.adSlot.findUnique({
      where: { id },
      include: {
        publisher: true,
        placements: {
          include: { campaign: { select: { id: true, name: true, status: true } } },
        },
      },
    });

    if (!adSlot) return void res.status(404).json({ error: 'Ad slot not found' });
    res.json(adSlot);
  } catch (error) {
    console.error('Error fetching marketplace ad slot:', error);
    res.status(500).json({ error: 'Failed to fetch ad slot' });
  }
});

// GET /api/ad-slots/:id - Get single ad slot with details
//with owneraship check
router.get('/:id', authMiddleware, roleMiddleware(['PUBLISHER']), async (req: AuthRequest, res: Response) => {
  try {
    const publisherId = req.user?.publisherId;
    if (!publisherId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const id = getParam(req.params.id);
    const adSlot = await prisma.adSlot.findUnique({
      where: { id },
      include: {
        publisher: true,
        placements: {
          include: {
            campaign: { select: { id: true, name: true, status: true } },
          },
        },
      },
    });

    //404 for missing resource
    if (!adSlot) {
      res.status(404).json({ error: 'Ad slot not found' });
      return;
    }
        // Requirement: 403 for other user's resource
    if (adSlot.publisherId !== publisherId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }


    res.json(adSlot);
  } catch (error) {
    console.error('Error fetching ad slot:', error);
    res.status(500).json({ error: 'Failed to fetch ad slot' });
  }
});


// POST /api/ad-slots - Create new ad slot
// BUG: This accepts 'dimensions' and 'pricingModel' fields that don't exist in Prisma schema
// BUG: No input validation for basePrice (could be negative or zero)
router.post('/', authMiddleware, roleMiddleware(['PUBLISHER']), async (req: AuthRequest, res: Response) => {
  try {
    const publisherId = req.user?.publisherId;
    if (!publisherId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { name, description, type, basePrice } = req.body;
    //challenge 1: remove dimensions, pricingModel
    if (!name || !type || basePrice === undefined || basePrice === null) {
      res.status(400).json({ error: 'Name, type, and basePrice are required' });
      return;
    }

    // TODO: Add authentication middleware to verify user owns publisherId
    // TODO: Validate that basePrice is positive

    const parsedBasePrice = Number(basePrice);
    if (!Number.isFinite(parsedBasePrice) || parsedBasePrice <= 0) {
      res.status(400).json({ error: 'basePrice must be a positive number' });
      return;
    }
    
    // TODO: Validate that 'type' is valid enum value
    if (!adSlotTypes.includes(type)) {
      res.status(400).json({ error: 'Invalid ad slot type' });
      return;
    }

    const adSlot = await prisma.adSlot.create({
      data: {
        name,
        description,
        type,
        basePrice: parsedBasePrice, //force ownership from authenticated user
        publisherId,
      },//challenge 1: remove dimensions, pricingModel
      include: {
        publisher: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(adSlot);
  } catch (error) {
    console.error('Error creating ad slot:', error);
    res.status(500).json({ error: 'Failed to create ad slot' });
  }
});

// POST /api/ad-slots/:id/book - Book an ad slot (simplified booking flow)
// This marks the slot as unavailable and creates a simple booking record
router.post('/:id/book', async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const { sponsorId, message } = req.body;

    if (!sponsorId) {
      res.status(400).json({ error: 'sponsorId is required' });
      return;
    }

    // Check if slot exists and is available
    const adSlot = await prisma.adSlot.findUnique({
      where: { id },
      include: { publisher: true },
    });

    if (!adSlot) {
      res.status(404).json({ error: 'Ad slot not found' });
      return;
    }

    if (!adSlot.isAvailable) {
      res.status(400).json({ error: 'Ad slot is no longer available' });
      return;
    }

    // Mark slot as unavailable
    const updatedSlot = await prisma.adSlot.update({
      where: { id },
      data: { isAvailable: false },
      include: {
        publisher: { select: { id: true, name: true } },
      },
    });

    // In a real app, you'd create a Placement record here
    // For now, we just mark it as booked
    console.log(`Ad slot ${id} booked by sponsor ${sponsorId}. Message: ${message || 'None'}`);

    res.json({
      success: true,
      message: 'Ad slot booked successfully!',
      adSlot: updatedSlot,
    });
  } catch (error) {
    console.error('Error booking ad slot:', error);
    res.status(500).json({ error: 'Failed to book ad slot' });
  }
});

// POST /api/ad-slots/:id/unbook - Reset ad slot to available (for testing)
router.post('/:id/unbook', async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);

    const updatedSlot = await prisma.adSlot.update({
      where: { id },
      data: { isAvailable: true },
      include: {
        publisher: { select: { id: true, name: true } },
      },
    });

    res.json({
      success: true,
      message: 'Ad slot is now available again',
      adSlot: updatedSlot,
    });
  } catch (error) {
    console.error('Error unbooking ad slot:', error);
    res.status(500).json({ error: 'Failed to unbook ad slot' });
  }
});

// TODO: Add PUT /api/ad-slots/:id endpoint
// TODO: Add DELETE /api/ad-slots/:id endpoint

// PUT /api/ad-slots/:id - Update with ownership check
router.put('/:id', authMiddleware, roleMiddleware(['PUBLISHER']), async (req: AuthRequest, res: Response) => {
  try {
    const publisherId = req.user?.publisherId;
    if (!publisherId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const id = getParam(req.params.id);
    const existingAdSlot = await prisma.adSlot.findUnique({ where: { id } });

    // Requirement: 404 if missing
    if (!existingAdSlot) {
      res.status(404).json({ error: 'Ad slot not found' });
      return;
    }

    // Requirement: 403 if not owner
    if (existingAdSlot.publisherId !== publisherId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { name, description, type, basePrice, isAvailable } = req.body;

    let parsedBasePrice: number | undefined;
    if (basePrice !== undefined) {
      parsedBasePrice = Number(basePrice);
      if (!Number.isFinite(parsedBasePrice) || parsedBasePrice <= 0) {
        res.status(400).json({ error: 'basePrice must be a positive number' });
        return;
      }
    }

    if (type !== undefined && !adSlotTypes.includes(type)) {
      res.status(400).json({ error: 'Invalid ad slot type' });
      return;
    }

    const updatedAdSlot = await prisma.adSlot.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(parsedBasePrice !== undefined && { basePrice: parsedBasePrice }),
        ...(isAvailable !== undefined && { isAvailable }),
      },
      include: {
        publisher: { select: { id: true, name: true } },
      },
    });

    res.json(updatedAdSlot);
  } catch (error) {
    console.error('Error updating ad slot:', error);
    res.status(500).json({ error: 'Failed to update ad slot' });
  }
});

// DELETE /api/ad-slots/:id - Delete with ownership check
router.delete('/:id', authMiddleware, roleMiddleware(['PUBLISHER']), async (req: AuthRequest, res: Response) => {
  try {
    const publisherId = req.user?.publisherId;
    if (!publisherId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const id = getParam(req.params.id);
    const existingAdSlot = await prisma.adSlot.findUnique({ where: { id } });

    // Requirement: 404 if missing
    if (!existingAdSlot) {
      res.status(404).json({ error: 'Ad slot not found' });
      return;
    }

    // Requirement: 403 if not owner
    if (existingAdSlot.publisherId !== publisherId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await prisma.adSlot.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting ad slot:', error);
    res.status(500).json({ error: 'Failed to delete ad slot' });
  }
});


export default router;
