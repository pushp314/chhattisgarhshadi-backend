import { Router } from 'express';
import { agentController } from '../controllers/agent.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createAgentSchema,
  updateAgentSchema,
  agentIdParamSchema,
  getAgentsSchema,
} from '../validation/agent.validation.js';

const router = Router();

// Note: Authentication (authenticate + requireAdmin)
// is already applied in src/routes/admin.routes.js
router
  .route('/')
  .post(validate(createAgentSchema), agentController.createAgent)
  .get(validate(getAgentsSchema), agentController.getAllAgents);

router
  .route('/:agentId')
  .get(validate(agentIdParamSchema), agentController.getAgentById)
  .put(validate(updateAgentSchema), agentController.updateAgent)
  .delete(validate(agentIdParamSchema), agentController.deleteAgent);

export default router;