import { Router, type Request, type Response, type IRouter } from 'express';
import { prisma } from '../db.js';
import type { Prisma } from '../generated/prisma/client.js';
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
// with ownership check and 404 for missing or not-owned resources
router.get('/:id', authMiddleware, roleMiddleware(['PUBLISHER']), async (req: AuthRequest, res: Response) => {
  try {
    const publisherId = req.user?.publisherId;
    if (!publisherId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const id = getParam(req.params.id);
    const adSlot = await prisma.adSlot.findUnique({
      where: { id, publisherId },
      include: {
        publisher: true,
        placements: {
          include: {
            campaign: { select: { id: true, name: true, status: true } },
          },
        },
      },
    });

    // 404 for missing resource or a resource not owned by this publisher
    if (!adSlot) {
      return void res.status(404).json({ error: 'Ad slot not found' });
    }

    res.status(200).json(adSlot);
  } catch (error) {
    console.error('Error fetching ad slot:', error);
    res.status(500).json({ error: 'Failed to fetch ad slot' });
  }
});


// POST /api/ad-slots - Create new ad slot
// Fixed BUG: This accepts 'dimensions' and 'pricingModel' fields that don't exist in Prisma schema
// Fixed BUG: No input validation for basePrice (could be negative or zero)
/*
Fixed broken create route
Validates name, type, and positive basePrice.
Validates optional real schema fields like position, width, height, cpmFloor, isAvailable
Forces ownership from req.user.publisherId instead of trusting client input
Returns 201 Created
*/
router.post('/', authMiddleware, roleMiddleware(['PUBLISHER']), async (req: AuthRequest, res: Response) => {
  try {
    const publisherId = req.user?.publisherId;
    if (!publisherId) {
      return void res.status(403).json({ error: 'Forbidden' });
    }

    const { name, description, type, position, width, height, basePrice, cpmFloor, isAvailable } = req.body;

    if (typeof name !== 'string' || !name.trim()) {
      return void res.status(400).json({ error: 'Name is required' });
    }

    if (typeof type !== 'string' || !adSlotTypes.includes(type as (typeof adSlotTypes)[number])) {
      return void res.status(400).json({ error: 'Invalid ad slot type' });
    }

    const parsedBasePrice = Number(basePrice);
    if (!Number.isFinite(parsedBasePrice) || parsedBasePrice <= 0) {
      return void res.status(400).json({ error: 'basePrice must be a positive number' });
    }

    const data: Prisma.AdSlotUncheckedCreateInput = {
      name: name.trim(),
      type: type as Prisma.AdSlotUncheckedCreateInput['type'],
      basePrice: parsedBasePrice,
      publisherId,
    };

    if (description !== undefined) {
      if (description !== null && typeof description !== 'string') {
        return void res.status(400).json({ error: 'Invalid description' });
      }
      data.description = description;
    }

    if (position !== undefined) {
      if (position !== null && typeof position !== 'string') {
        return void res.status(400).json({ error: 'Invalid position' });
      }
      data.position = position;
    }

    if (width !== undefined) {
      const parsedWidth = Number(width);
      if (!Number.isInteger(parsedWidth) || parsedWidth <= 0) {
        return void res.status(400).json({ error: 'Invalid width' });
      }
      data.width = parsedWidth;
    }

    if (height !== undefined) {
      const parsedHeight = Number(height);
      if (!Number.isInteger(parsedHeight) || parsedHeight <= 0) {
        return void res.status(400).json({ error: 'Invalid height' });
      }
      data.height = parsedHeight;
    }

    if (cpmFloor !== undefined) {
      const parsedCpmFloor = Number(cpmFloor);
      if (!Number.isFinite(parsedCpmFloor) || parsedCpmFloor < 0) {
        return void res.status(400).json({ error: 'Invalid cpmFloor' });
      }
      data.cpmFloor = parsedCpmFloor;
    }

    if (isAvailable !== undefined) {
      if (typeof isAvailable !== 'boolean') {
        return void res.status(400).json({ error: 'Invalid isAvailable' });
      }
      data.isAvailable = isAvailable;
    }

    const adSlot = await prisma.adSlot.create({
      data,
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

// PUT /api/ad-slots/:id - Update with ownership check
/*
Uses validation before update.
Uses ownership-scoped lookup before modifying.
Returns 400 for bad input, 404 if missing/not owned, and 200 on success.
*/
router.put('/:id', authMiddleware, roleMiddleware(['PUBLISHER']), async (req: AuthRequest, res: Response) => {
  try {
    const publisherId = req.user?.publisherId;
    if (!publisherId) {
      return void res.status(403).json({ error: 'Forbidden' });
    }

    const id = getParam(req.params.id);
    const { name, description, type, position, width, height, basePrice, cpmFloor, isAvailable } = req.body;

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

    if (type !== undefined) {
      if (typeof type !== 'string' || !adSlotTypes.includes(type as (typeof adSlotTypes)[number])) {
        return void res.status(400).json({ error: 'Invalid ad slot type' });
      }
      data.type = type;
    }

    if (position !== undefined) {
      if (position !== null && typeof position !== 'string') {
        return void res.status(400).json({ error: 'Invalid position' });
      }
      data.position = position;
    }

    if (width !== undefined) {
      const parsedWidth = Number(width);
      if (!Number.isInteger(parsedWidth) || parsedWidth <= 0) {
        return void res.status(400).json({ error: 'Invalid width' });
      }
      data.width = parsedWidth;
    }

    if (height !== undefined) {
      const parsedHeight = Number(height);
      if (!Number.isInteger(parsedHeight) || parsedHeight <= 0) {
        return void res.status(400).json({ error: 'Invalid height' });
      }
      data.height = parsedHeight;
    }

    if (basePrice !== undefined) {
      const parsedBasePrice = Number(basePrice);
      if (!Number.isFinite(parsedBasePrice) || parsedBasePrice <= 0) {
        return void res.status(400).json({ error: 'basePrice must be a positive number' });
      }
      data.basePrice = parsedBasePrice;
    }

    if (cpmFloor !== undefined) {
      const parsedCpmFloor = Number(cpmFloor);
      if (!Number.isFinite(parsedCpmFloor) || parsedCpmFloor < 0) {
        return void res.status(400).json({ error: 'Invalid cpmFloor' });
      }
      data.cpmFloor = parsedCpmFloor;
    }

    if (isAvailable !== undefined) {
      if (typeof isAvailable !== 'boolean') {
        return void res.status(400).json({ error: 'Invalid isAvailable' });
      }
      data.isAvailable = isAvailable;
    }

    if (Object.keys(data).length === 0) {
      return void res.status(400).json({ error: 'No valid fields provided' });
    }

    const existingAdSlot = await prisma.adSlot.findFirst({
      where: {
        id,
        publisherId,
      },
    });

    if (!existingAdSlot) {
      return void res.status(404).json({ error: 'Ad slot not found' });
    }

    const updatedAdSlot = await prisma.adSlot.update({
      where: { id },
      data,
      include: {
        publisher: { select: { id: true, name: true } },
      },
    });

    res.status(200).json(updatedAdSlot);
  } catch (error) {
    console.error('Error updating ad slot:', error);
    res.status(500).json({ error: 'Failed to update ad slot' });
  }
});


// DELETE /api/ad-slots/:id - Delete with ownership check
/*
Verifies ownership before delete
404 if missing or not owned
204 No Content on success
*/
router.delete('/:id', authMiddleware, roleMiddleware(['PUBLISHER']), async (req: AuthRequest, res: Response) => {
  try {
    const publisherId = req.user?.publisherId;
    if (!publisherId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const id = getParam(req.params.id);
    const existingAdSlot = await prisma.adSlot.findUnique({ where: { id, publisherId } });

    // 404 if resource does not exist or is not owned by this publisher
    if (!existingAdSlot) {
      return void res.status(404).json({ error: 'Ad slot not found' });
    }

    await prisma.adSlot.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting ad slot:', error);
    res.status(500).json({ error: 'Failed to delete ad slot' });
  }
});


export default router;
