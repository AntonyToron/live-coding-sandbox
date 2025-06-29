import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Pad, User } from '../models';
import { AuthenticatedRequest, authenticateToken, optionalAuth } from '../middleware/auth';
import { ProgrammingLanguage } from '../types';

const router = Router();

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const pads = await Pad.findAll({
      where: { user_id: req.user.userId },
      order: [['updated_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email'],
        },
      ],
    });

    res.json({ pads });
  } catch (error) {
    console.error('Get pads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { title, language, code, is_public } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const validLanguages: ProgrammingLanguage[] = [
      'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'cpp'
    ];

    if (language && !validLanguages.includes(language)) {
      return res.status(400).json({ error: 'Invalid programming language' });
    }

    const pad = await Pad.create({
      title,
      language: language || 'javascript',
      code: code || '',
      is_public: is_public || false,
      user_id: req.user.userId,
    });

    const padWithUser = await Pad.findByPk(pad.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email'],
        },
      ],
    });

    res.status(201).json({ pad: padWithUser });
  } catch (error) {
    console.error('Create pad error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const pad = await Pad.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email'],
        },
      ],
    });

    if (!pad) {
      return res.status(404).json({ error: 'Pad not found' });
    }

    if (!pad.is_public && (!req.user || pad.user_id !== req.user.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ pad });
  } catch (error) {
    console.error('Get pad error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;
    const { title, language, code, is_public } = req.body;

    const pad = await Pad.findByPk(id);
    if (!pad) {
      return res.status(404).json({ error: 'Pad not found' });
    }

    if (pad.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const validLanguages: ProgrammingLanguage[] = [
      'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'cpp'
    ];

    if (language && !validLanguages.includes(language)) {
      return res.status(400).json({ error: 'Invalid programming language' });
    }

    await pad.update({
      ...(title !== undefined && { title }),
      ...(language !== undefined && { language }),
      ...(code !== undefined && { code }),
      ...(is_public !== undefined && { is_public }),
    });

    const updatedPad = await Pad.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email'],
        },
      ],
    });

    res.json({ pad: updatedPad });
  } catch (error) {
    console.error('Update pad error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;

    const pad = await Pad.findByPk(id);
    if (!pad) {
      return res.status(404).json({ error: 'Pad not found' });
    }

    if (pad.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pad.destroy();
    res.json({ message: 'Pad deleted successfully' });
  } catch (error) {
    console.error('Delete pad error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/share', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;

    const pad = await Pad.findByPk(id);
    if (!pad) {
      return res.status(404).json({ error: 'Pad not found' });
    }

    if (pad.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!pad.share_token) {
      const shareToken = uuidv4();
      await pad.update({ share_token: shareToken });
    }

    res.json({ share_token: pad.share_token });
  } catch (error) {
    console.error('Generate share token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/share/:token', async (req, res: Response) => {
  try {
    const { token } = req.params;

    const pad = await Pad.findOne({
      where: { share_token: token },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email'],
        },
      ],
    });

    if (!pad) {
      return res.status(404).json({ error: 'Shared pad not found' });
    }

    res.json({ pad });
  } catch (error) {
    console.error('Get shared pad error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;