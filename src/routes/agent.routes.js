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

/**
 * @swagger
 * /api/v1/admin/agents:
 * post:
 * summary: (Admin) Create a new agent
 * tags: [Admin - Agents]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/CreateAgent'
 * responses:
 * 201:
 * description: Agent created successfully
 * get:
 * summary: (Admin) Get all agents
 * tags: [Admin - Agents]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: query
 * name: page
 * - in: query
 * name: limit
 * - in: query
 * name: status
 * - in: query
 * name: district
 * - in: query
 * name: search
 * responses:
 * 200:
 * description: List of agents
 */
router
  .route('/')
  .post(validate(createAgentSchema), agentController.createAgent)
  .get(validate(getAgentsSchema), agentController.getAllAgents);

/**
 * @swagger
 * /api/v1/admin/agents/{agentId}:
 * get:
 * summary: (Admin) Get a single agent by ID
 * tags: [Admin - Agents]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: agentId
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: Agent details
 * put:
 * summary: (Admin) Update an agent
 * tags: [Admin - Agents]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: agentId
 * required: true
 * schema:
 * type: integer
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/UpdateAgent'
 * responses:
 * 200:
 * description: Agent updated successfully
 * delete:
 * summary: (Admin) Soft delete an agent
 * tags: [Admin - Agents]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: agentId
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: Agent deleted successfully
 */
router
  .route('/:agentId')
  .get(validate(agentIdParamSchema), agentController.getAgentById)
  .put(validate(updateAgentSchema), agentController.updateAgent)
  .delete(validate(agentIdParamSchema), agentController.deleteAgent);

export default router;