import { Router } from 'express';
import { ProjectController } from '@/controllers/projectController';
import { authenticate, requireProjectAccess, requireRole } from '@/middleware/auth';
import { 
  createProjectSchema, 
  updateProjectSchema,
  createCollaboratorSchema,
  paginationSchema,
  validate 
} from '@/utils/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Project CRUD routes
router.post('/', 
  validate(createProjectSchema),
  ProjectController.createProject
);

router.get('/', 
  validate(paginationSchema),
  ProjectController.getProjects
);

router.get('/:id', 
  requireProjectAccess,
  ProjectController.getProjectById
);

router.put('/:id', 
  requireRole(['owner']),
  validate(updateProjectSchema),
  ProjectController.updateProject
);

router.delete('/:id', 
  requireRole(['owner']),
  ProjectController.deleteProject
);

// Collaboration routes
router.post('/:id/collaborators', 
  requireRole(['owner']),
  validate(createCollaboratorSchema),
  ProjectController.addCollaborator
);

router.get('/:id/collaborators', 
  requireProjectAccess,
  ProjectController.getCollaborators
);

router.put('/:id/collaborators/:collaboratorId', 
  requireRole(['owner']),
  ProjectController.updateCollaboratorRole
);

router.delete('/:id/collaborators/:collaboratorId', 
  requireRole(['owner']),
  ProjectController.removeCollaborator
);

export default router;
