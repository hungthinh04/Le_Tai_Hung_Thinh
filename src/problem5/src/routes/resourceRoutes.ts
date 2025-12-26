import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { Resource, CreateResourceDto, UpdateResourceDto, FilterQuery } from '../types';

const router = Router();

// Helper to get database from app locals
const getDb = (req: Request): Database => {
  return req.app.locals.db as Database;
};

// 1. Create a resource
router.post('/', (req: Request, res: Response) => {
  try {
    const db = getDb(req);
    const { name, description, status }: CreateResourceDto = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }

    const stmt = db.prepare(`
      INSERT INTO resources (name, description, status)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(
      name.trim(),
      description?.trim() || null,
      status || 'active'
    );

    const newResource = db.prepare('SELECT * FROM resources WHERE id = ?').get(result.lastInsertRowid) as Resource;

    res.status(201).json({
      message: 'Resource created successfully',
      data: newResource
    });
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. List resources with basic filters
router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDb(req);
    const { status, search, limit = 100, offset = 0 }: FilterQuery = req.query as any;

    let query = 'SELECT * FROM resources WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const resources = db.prepare(query).all(...params) as Resource[];

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM resources WHERE 1=1';
    const countParams: any[] = [];

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    if (search) {
      countQuery += ' AND (name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    const totalResult = db.prepare(countQuery).get(...countParams) as { total: number };

    res.json({
      data: resources,
      pagination: {
        total: totalResult.total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error) {
    console.error('Error listing resources:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Get details of a resource
router.get('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb(req);
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid resource ID' });
    }

    const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(id) as Resource | undefined;

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json({ data: resource });
  } catch (error) {
    console.error('Error getting resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Update resource details
router.put('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb(req);
    const id = parseInt(req.params.id);
    const { name, description, status }: UpdateResourceDto = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid resource ID' });
    }

    // Check if resource exists
    const existing = db.prepare('SELECT * FROM resources WHERE id = ?').get(id) as Resource | undefined;
    if (!existing) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      if (name.trim() === '') {
        return res.status(400).json({ error: 'Name cannot be empty' });
      }
      updates.push('name = ?');
      values.push(name.trim());
    }

    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description?.trim() || null);
    }

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE resources SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);

    const updated = db.prepare('SELECT * FROM resources WHERE id = ?').get(id) as Resource;

    res.json({
      message: 'Resource updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. Delete a resource
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb(req);
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid resource ID' });
    }

    // Check if resource exists
    const existing = db.prepare('SELECT * FROM resources WHERE id = ?').get(id) as Resource | undefined;
    if (!existing) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    db.prepare('DELETE FROM resources WHERE id = ?').run(id);

    res.json({
      message: 'Resource deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as resourceRoutes };

