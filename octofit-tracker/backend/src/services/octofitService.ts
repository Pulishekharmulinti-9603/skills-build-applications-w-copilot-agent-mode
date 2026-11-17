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

export async function createTeam(input: unknown) {
  const data = input as Record<string, unknown>;

  // Validate required fields
  if (!data.name) {
    const error = new Error('Missing required field: name');
    throw Object.assign(error, { status: 400 });
  }

  if (!data.mascot) {
    const error = new Error('Missing required field: mascot');
    throw Object.assign(error, { status: 400 });
  }

  // Create team with optional members
  const team = await Team.create({
    name: data.name,
    mascot: data.mascot,
    members: (data.members as string[]) || [],
  });

  return team.toObject();
}

export async function getLeaderboard() {
  // Aggregate activities by team to get total points per team
  const teamPoints = await Activity.aggregate([
    {
      $group: {
        _id: '$team',
        totalPoints: { $sum: '$points' },
      },
    },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: '_id',
        as: 'teamData',
      },
    },
    {
      $unwind: '$teamData',
    },
    {
      $project: {
        _id: 1,
        totalPoints: 1,
        teamName: '$teamData.name',
      },
    },
    {
      $sort: { totalPoints: -1 },
    },
  ]);

  // Assign 1-based rank to each entry
  return teamPoints.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(_userEmail: string) {
  return Workout.find().limit(1).lean();
}

export { User };
