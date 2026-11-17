import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const data = input as Record<string, unknown>;
  
  // Validate required fields
  if (!data.userId || !data.teamId || !data.type || data.minutes === undefined) {
    const error = new Error('Missing required fields: userId, teamId, type, minutes');
    throw Object.assign(error, { status: 400 });
  }

  // Validate that userId and teamId are well-formed ObjectIds
  if (!mongoose.Types.ObjectId.isValid(data.userId as string)) {
    const error = new Error('Invalid userId format');
    throw Object.assign(error, { status: 400 });
  }

  if (!mongoose.Types.ObjectId.isValid(data.teamId as string)) {
    const error = new Error('Invalid teamId format');
    throw Object.assign(error, { status: 400 });
  }

  // Check if user and team exist
  const user = await User.findById(data.userId);
  if (!user) {
    const error = new Error('User not found');
    throw Object.assign(error, { status: 400 });
  }

  const team = await Team.findById(data.teamId);
  if (!team) {
    const error = new Error('Team not found');
    throw Object.assign(error, { status: 400 });
  }

  // Calculate points (1 point per minute)
  const points = Number(data.minutes) || 0;

  // Create activity with computed values
  const activity = await Activity.create({
    user: data.userId,
    team: data.teamId,
    type: data.type,
    minutes: data.minutes,
    points,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(_input: unknown) {
  throw Object.assign(new Error('Team validation is not implemented yet'), { status: 501 });
}

export async function getLeaderboard() {
  return [];
}

export async function suggestWorkouts(_userEmail: string) {
  return Workout.find().limit(1).lean();
}

export { User };
