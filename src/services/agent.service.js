import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { getPaginationParams, getPaginationMetadata } from '../utils/helpers.js';
import { logger } from '../config/logger.js';

/**
 * [Admin] Create a new agent
 * @param {Object} data - Validated agent data
 * @param {number} adminId - The ID of the admin creating the agent
 * @returns {Promise<Object>} The created agent
 */
export const createAgent = async (data, adminId) => {
  try {
    const existingAgent = await prisma.agent.findUnique({
      where: { agentCode: data.agentCode },
    });

    if (existingAgent) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'An agent with this code already exists');
    }

    const agent = await prisma.agent.create({
      data: {
        ...data,
        createdBy: adminId,
      },
    });
    logger.info(`Admin ${adminId} created new agent ${agent.id}`);
    return agent;
  } catch (error) {
    logger.error('Error in createAgent:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error creating agent');
  }
};

/**
 * [Admin] Get all agents (paginated and filterable)
 * @param {Object} query - Validated query params
 * @returns {Promise<Object>} Paginated list of agents
 */
export const getAllAgents = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const { status, district, search } = query;

  const where = {
    deletedAt: null, // Don't show soft-deleted agents
  };

  if (status) where.status = status;
  if (district) where.district = { equals: district, mode: 'insensitive' };
  if (search) {
    where.OR = [
      { agentName: { contains: search, mode: 'insensitive' } },
      { agentCode: { equals: search } },
      { phone: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  try {
    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.agent.count({ where }),
    ]);

    const pagination = getPaginationMetadata(page, limit, total);
    return { agents, pagination };
  } catch (error) {
    logger.error('Error in getAllAgents:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving agents');
  }
};

/**
 * [Admin] Get a single agent by ID
 * @param {number} agentId - The agent's ID
 * @returns {Promise<Object>} The agent object
 */
export const getAgentById = async (agentId) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId, deletedAt: null },
      include: {
        users: { take: 10, orderBy: { createdAt: 'desc' } }, // Include recent users
        commissions: { take: 10, orderBy: { createdAt: 'desc' } }, // Include recent commissions
      }
    });

    if (!agent) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Agent not found');
    }
    return agent;
  } catch (error) {
    logger.error('Error in getAgentById:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error retrieving agent');
  }
};

/**
 * [Admin] Update an agent's details
 * @param {number} agentId - The agent's ID
 * @param {Object} data - Validated update data
 * @returns {Promise<Object>} The updated agent
 */
export const updateAgent = async (agentId, data) => {
  try {
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Agent not found');
    }

    const updatedAgent = await prisma.agent.update({
      where: { id: agentId },
      data: {
        ...data,
        // If status is updated, also update isActive
        ...(data.status && { isActive: data.status === 'ACTIVE' }),
      },
    });

    logger.info(`Agent ${agentId} updated by admin`);
    return updatedAgent;
  } catch (error) {
    logger.error('Error in updateAgent:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error updating agent');
  }
};

/**
 * [Admin] Soft delete an agent
 * @param {number} agentId - The agent's ID
 * @returns {Promise<void>}
 */
export const deleteAgent = async (agentId) => {
  try {
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Agent not found');
    }

    // Soft delete
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        deletedAt: new Date(),
        isActive: false,
        status: 'TERMINATED',
        email: `${agent.email}.deleted.${Date.now()}`, // Anonymize PII
        phone: null,
      },
    });

    logger.info(`Agent ${agentId} soft-deleted by admin`);
  } catch (error) {
    logger.error('Error in deleteAgent:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error deleting agent');
  }
};

export const agentService = {
  createAgent,
  getAllAgents,
  getAgentById,
  updateAgent,
  deleteAgent,
};