import type { Program } from '../types';

export const programs: Program[] = [
  {
    id: 'crossfit',
    title: 'CrossFit',
    description: 'High-intensity functional fitness for all levels. Build strength, endurance, and community.',
    features: [
      'Constantly varied workouts',
      'Functional movements',
      'High intensity training',
      'Scalable for any fitness level',
      'Expert coaching',
    ],
    level: 'all',
  },
  {
    id: 'comet-plus',
    title: 'Comet Plus',
    description: 'Premium membership with unlimited access to all classes and exclusive member benefits.',
    features: [
      'Unlimited class access',
      'All program participation',
      'Priority class booking',
      'Exclusive member events',
      'Personalized coaching check-ins',
    ],
    level: 'all',
  },
  {
    id: 'crossfit-gymnastics',
    title: 'CrossFit Gymnastics',
    description: 'Develop gymnastics skills and body control. Master movements like handstands, muscle-ups, and more.',
    features: [
      'Skill progressions',
      'Body awareness training',
      'Handstand work',
      'Bar and ring movements',
      'Flexibility development',
    ],
    level: 'intermediate',
  },
  {
    id: 'functional-bodybuilding',
    title: 'Functional Bodybuilding',
    description: 'Build muscle and improve movement quality with intentional strength training and accessory work.',
    features: [
      'Hypertrophy focus',
      'Movement quality emphasis',
      'Accessory programming',
      'Tempo training',
      'Injury prevention',
    ],
    level: 'all',
  },
  {
    id: 'weightlifting',
    title: 'Weightlifting',
    description: 'Olympic weightlifting technique and strength. Master the snatch and clean & jerk.',
    features: [
      'Olympic lift focus',
      'Technical coaching',
      'Strength programming',
      'Competition preparation',
      'Small class sizes',
    ],
    level: 'intermediate',
  },
  {
    id: 'open-gym',
    title: 'Open Gym',
    description: 'Train on your own schedule. Access to all equipment and facilities during open gym hours.',
    features: [
      'Flexible schedule',
      'All equipment available',
      'Self-directed training',
      'Coach available for questions',
      'Perfect for experienced athletes',
    ],
    level: 'intermediate',
  },
];
