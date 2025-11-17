import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { agentService } from '../services/agent.service.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * [Admin] Create a new agent
 */
export const createAgent = asyncHandler(async (req, res) => {
  const agent = await agentService.createAgent(req.body, req.user.id);
  res
    .status(HTTP_STATUS.CREATED)
    .json(
      new ApiResponse(HTTP_STATUS.CREATED, agent, 'Agent created successfully')
    );
});

/**
 * [Admin] Get all agents
 */
export const getAllAgents = asyncHandler(async (req, res) => {
  const result = await agentService.getAllAgents(req.query);
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, result, 'Agents retrieved successfully')
    );
});

/**
 * [Admin] Get a single agent by ID
 */
export const getAgentById = asyncHandler(async (req, res) => {
  const agent = await agentService.getAgentById(req.params.agentId);
  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, agent, 'Agent retrieved successfully'));
});

/**
 * [Admin] Update an agent
 */
export const updateAgent = asyncHandler(async (req, res) => {
  const updatedAgent = await agentService.updateAgent(
    req.params.agentId,
    req.body
  );
  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, updatedAgent, 'Agent updated successfully')
    );
});

/**
 * [Admin] Delete an agent (Soft Delete)
 */
export const deleteAgent = asyncHandler(async (req, res) => {
  await agentService.deleteAgent(req.params.agentId);
  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, null, 'Agent deleted successfully'));
});

export const agentController = {
  createAgent,
  getAllAgents,
  getAgentById,
  updateAgent,
  deleteAgent,
};