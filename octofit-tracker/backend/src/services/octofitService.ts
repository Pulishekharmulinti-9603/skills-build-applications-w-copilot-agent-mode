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
  const teams = await Team.find().lean();
  return teams.map(team => ({
    ...team,
    members: team.members.map(m => m.toString()),
  }));
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

  const teamObj = team.toObject();
  return {
    ...teamObj,
    members: teamObj.members.map(m => m.toString()),
  };
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

export async function suggestWorkouts(userEmail: string) {
  // Decode URL-encoded email
  const decodedEmail = decodeURIComponent(userEmail);
  
  // Find user by email
  const user = await User.findOne({ email: decodedEmail });
  if (!user) {
    const error = new Error('User not found');
    throw Object.assign(error, { status: 404 });
  }

  // Get user's recent activities to identify patterns
  const recentActivities = await Activity.find({ user: user._id })
    .sort({ occurredAt: -1 })
    .limit(5)
    .lean();

  // Determine what focus area to suggest based on user's goal and recent activities
  let suggestedFocus = user.fitnessGoal || 'endurance';
  
  // If user has recent activities, consider the most common activity type
  if (recentActivities.length > 0) {
    const activityTypes = recentActivities.map(a => a.type);
    const typeCounts: Record<string, number> = {};
    activityTypes.forEach(type => {
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    // Map activity types to workout focus areas
    const typeToFocus: Record<string, string> = {
      'run': 'endurance',
      'cycle': 'endurance',
      'strength': 'strength',
      'swim': 'endurance',
      'walk': 'endurance',
    };
    
    // Get the most common type
    const mostCommonType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (mostCommonType && typeToFocus[mostCommonType]) {
      suggestedFocus = typeToFocus[mostCommonType];
    }
  }

  // Find workouts matching the suggested focus
  const matchingWorkouts = await Workout.find({ focus: suggestedFocus }).lean();
  
  if (matchingWorkouts.length === 0) {
    // Fallback: return any workout with a reason
    const anyWorkout = await Workout.findOne().lean();
    if (!anyWorkout) {
      return [];
    }
    return [{
      ...anyWorkout,
      reason: `Workout recommendation based on fitness profile`,
    }];
  }

  // Return first matching workout with reason
  const suggestion = matchingWorkouts[0];
  const reason = recentActivities.length > 0
    ? `Suggested based on your recent ${recentActivities[0].type} activity and ${suggestedFocus} goal`
    : `Suggested to help you achieve your ${suggestedFocus} goal`;

  return [{
    ...suggestion,
    reason,
  }];
}

export { User };
