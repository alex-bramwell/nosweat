export interface ProgramDetail {
  id: string;
  title: string;
  tagline: string;
  overview: string;
  benefits: {
    title: string;
    description: string;
  }[];
  whoIsItFor: string[];
  schedule?: string;
  pricing?: string;
}

export const programDetails: Record<string, ProgramDetail> = {
  'crossfit': {
    id: 'crossfit',
    title: 'CrossFit',
    tagline: 'Forge Elite Fitness Through Functional Movement',
    overview: 'CrossFit combines weightlifting, gymnastics, and metabolic conditioning into varied daily workouts that challenge every aspect of your fitness. Our expert coaches scale each workout to your ability level, ensuring you get a safe, effective workout every time.',
    benefits: [
      {
        title: 'Constantly Varied',
        description: 'No two workouts are the same. Keep your body adapting and your mind engaged with new challenges daily.',
      },
      {
        title: 'Functional Movements',
        description: 'Master movements that translate to real-life strength and capability, from squats to pull-ups.',
      },
      {
        title: 'Community Driven',
        description: 'Train alongside supportive athletes who push you to be your best and celebrate your progress.',
      },
      {
        title: 'Scalable',
        description: 'Whether you\'re brand new or a seasoned athlete, workouts are tailored to your current fitness level.',
      },
    ],
    whoIsItFor: [
      'Anyone looking to improve overall fitness',
      'Athletes seeking functional strength',
      'People who thrive in group settings',
      'Those ready to challenge themselves',
    ],
    schedule: 'Multiple daily sessions Mon-Fri, weekends available',
    pricing: 'Starting at $175/month',
  },
  'comet-plus': {
    id: 'comet-plus',
    title: 'Comet Plus',
    tagline: 'Premium Access to Your Complete Fitness Journey',
    overview: 'Our most comprehensive membership offers unlimited access to all classes, priority booking, and exclusive benefits. Perfect for dedicated athletes who want maximum flexibility and value.',
    benefits: [
      {
        title: 'Unlimited Classes',
        description: 'Attend any class, any time. Mix CrossFit with specialty programs for complete fitness development.',
      },
      {
        title: 'Priority Booking',
        description: 'Never miss your preferred class time with priority reservation access.',
      },
      {
        title: 'Exclusive Events',
        description: 'Members-only workshops, social events, and special programming throughout the year.',
      },
      {
        title: 'Personal Check-ins',
        description: 'Regular one-on-one sessions with coaches to track progress and optimize your training.',
      },
    ],
    whoIsItFor: [
      'Committed athletes training 5+ days per week',
      'Those wanting access to all specialty programs',
      'Athletes with varying schedules',
      'Members seeking the best value',
    ],
    schedule: 'Access to all class times and programs',
    pricing: '$250/month unlimited',
  },
  'crossfit-gymnastics': {
    id: 'crossfit-gymnastics',
    title: 'CrossFit Gymnastics',
    tagline: 'Master Bodyweight Control and Gymnastics Skills',
    overview: 'Develop impressive gymnastics skills through progressive programming. From handstands to muscle-ups, our dedicated gymnastics sessions focus on building the strength, flexibility, and technique needed for advanced movements.',
    benefits: [
      {
        title: 'Skill Progressions',
        description: 'Systematic approach to building gymnastics skills from foundations to advanced movements.',
      },
      {
        title: 'Body Awareness',
        description: 'Develop kinesthetic awareness and control through targeted drills and practice.',
      },
      {
        title: 'Dedicated Time',
        description: 'Focus solely on gymnastics without the pressure of a timed workout.',
      },
      {
        title: 'Small Groups',
        description: 'Low coach-to-athlete ratios ensure personalized attention and feedback.',
      },
    ],
    whoIsItFor: [
      'Athletes wanting to improve gymnastics skills',
      'Those working toward muscle-ups, handstands, etc.',
      'CrossFitters looking to strengthen weaknesses',
      'Anyone interested in bodyweight mastery',
    ],
    schedule: 'Saturdays 10:30 AM',
    pricing: 'Included with membership or $30 drop-in',
  },
  'functional-bodybuilding': {
    id: 'functional-bodybuilding',
    title: 'Functional Bodybuilding',
    tagline: 'Build Muscle With Purpose and Movement Quality',
    overview: 'Combine the muscle-building benefits of bodybuilding with functional movement patterns. This program emphasizes controlled tempo work, accessory movements, and hypertrophy while maintaining the movement quality that keeps you injury-free.',
    benefits: [
      {
        title: 'Hypertrophy Focus',
        description: 'Structured programming designed to build lean muscle mass effectively.',
      },
      {
        title: 'Movement Quality',
        description: 'Every rep performed with intention and proper mechanics for long-term health.',
      },
      {
        title: 'Tempo Training',
        description: 'Controlled eccentric and concentric phases maximize muscle engagement and growth.',
      },
      {
        title: 'Injury Prevention',
        description: 'Build resilient muscles and joints through balanced programming and proper progression.',
      },
    ],
    whoIsItFor: [
      'Athletes looking to build muscle',
      'Those recovering from or preventing injuries',
      'CrossFitters wanting accessory work',
      'Anyone seeking aesthetic and functional gains',
    ],
    schedule: 'Saturdays 10:30 AM',
    pricing: 'Included with membership or $30 drop-in',
  },
  'weightlifting': {
    id: 'weightlifting',
    title: 'Weightlifting',
    tagline: 'Master the Snatch and Clean & Jerk',
    overview: 'Olympic weightlifting is the pinnacle of strength, speed, and technique. Our dedicated weightlifting program helps you develop the positions, timing, and power needed to move heavy weights overhead with confidence.',
    benefits: [
      {
        title: 'Technical Mastery',
        description: 'Detailed coaching on the complex positions and movements of Olympic lifting.',
      },
      {
        title: 'Strength Development',
        description: 'Build explosive power and full-body strength through the snatch and clean & jerk.',
      },
      {
        title: 'Competition Prep',
        description: 'Programming designed to prepare athletes for local and national competitions.',
      },
      {
        title: 'Expert Coaching',
        description: 'Work with coaches experienced in Olympic weightlifting technique and programming.',
      },
    ],
    whoIsItFor: [
      'Athletes serious about Olympic lifting',
      'Those preparing for competitions',
      'CrossFitters wanting to improve lifts',
      'Anyone passionate about barbell sports',
    ],
    schedule: 'Saturdays 10:30 AM',
    pricing: 'Included with membership or $30 drop-in',
  },
  'open-gym': {
    id: 'open-gym',
    title: 'Open Gym',
    tagline: 'Train On Your Terms',
    overview: 'Sometimes the best workout is the one you design yourself. Open Gym gives experienced athletes access to all our equipment and facilities to train on their own programming, perfect a skill, or get extra work in.',
    benefits: [
      {
        title: 'Flexible Schedule',
        description: 'Train when it works for you with multiple open gym sessions throughout the week.',
      },
      {
        title: 'Full Equipment Access',
        description: 'Use any equipment in the gym for your personal training goals.',
      },
      {
        title: 'Self-Directed',
        description: 'Follow your own program, work on skills, or do extra accessory work.',
      },
      {
        title: 'Coach Support',
        description: 'Coaches available to answer questions or provide movement feedback.',
      },
    ],
    whoIsItFor: [
      'Experienced athletes with their own programming',
      'Those wanting extra skill practice',
      'Athletes following online programming',
      'Members needing flexible training times',
    ],
    schedule: 'Multiple sessions daily - see schedule',
    pricing: 'Included with membership',
  },
};
