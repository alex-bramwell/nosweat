import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing environment variables');
  console.error('Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY are set in .env');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Coach data with full profile information
const coaches = [
  {
    email: 'dan@crossfitcomet.com',
    name: 'Dan',
    coachId: 'dan',
    title: 'Head Coach',
    bio: 'With over 10 years of CrossFit coaching experience, Dan leads our team with a passion for functional fitness and athlete development. His coaching philosophy focuses on building strong foundations and sustainable progression.',
    certifications: [
      'CrossFit Level 3 Trainer',
      'USAW Sports Performance Coach',
      'Precision Nutrition Level 1',
    ],
    specialties: [
      'Olympic Weightlifting',
      'Strength & Conditioning',
      'Competition Prep',
    ],
  },
  {
    email: 'lizzie@crossfitcomet.com',
    name: 'Lizzie',
    coachId: 'lizzie',
    title: 'Senior Coach',
    bio: 'Lizzie brings energy and expertise to every class she coaches. Her background in gymnastics and athletic training makes her exceptional at teaching movement mechanics and helping athletes achieve their first pull-ups, muscle-ups, and handstand push-ups.',
    certifications: [
      'CrossFit Level 2 Trainer',
      'Gymnastics Specialty',
      'Movement & Mobility Specialist',
    ],
    specialties: [
      'Gymnastics Skills',
      'Mobility & Flexibility',
      'Skill Development',
    ],
  },
  {
    email: 'lewis@crossfitcomet.com',
    name: 'Lewis',
    coachId: 'lewis',
    title: 'Performance Coach',
    bio: 'Lewis specializes in strength programming and performance optimization. His analytical approach to training helps athletes break through plateaus and achieve new personal records. He has a talent for making complex movements accessible to beginners.',
    certifications: [
      'CrossFit Level 2 Trainer',
      'USAW Level 1 Coach',
      'Certified Strength & Conditioning Specialist',
    ],
    specialties: [
      'Strength Programming',
      'Barbell Cycling',
      'Performance Analysis',
    ],
  },
  {
    email: 'sam@crossfitcomet.com',
    name: 'Sam',
    coachId: 'sam',
    title: 'CrossFit Coach',
    bio: 'Sam is known for creating an inclusive and motivating atmosphere in every class. With a focus on proper scaling and modification, Sam ensures that every athlete gets a challenging workout tailored to their ability level.',
    certifications: [
      'CrossFit Level 2 Trainer',
      'Nutrition Coaching',
      'Adaptive & Inclusive Training',
    ],
    specialties: [
      'Beginner Foundations',
      'Nutrition Coaching',
      'Metabolic Conditioning',
    ],
  },
  {
    email: 'george@crossfitcomet.com',
    name: 'George',
    coachId: 'george',
    title: 'CrossFit Coach',
    bio: 'George combines technical precision with high energy coaching. His background in competitive CrossFit gives him unique insights into efficient movement patterns and competition strategies. He loves helping athletes reach their competitive goals.',
    certifications: [
      'CrossFit Level 2 Trainer',
      'Sports Psychology Certificate',
      'Endurance Training Specialist',
    ],
    specialties: [
      'Competition Training',
      'Mental Performance',
      'Endurance Development',
    ],
  },
  {
    email: 'thea@crossfitcomet.com',
    name: 'Thea',
    coachId: 'thea',
    title: 'CrossFit Coach',
    bio: 'Thea brings warmth and technical expertise to every session. Her focus on form and safety combined with her encouraging coaching style helps athletes build confidence while mastering complex movements. She has a special talent for helping members overcome mental barriers.',
    certifications: [
      'CrossFit Level 2 Trainer',
      'Functional Movement Screen Specialist',
      'Pre & Postnatal Coaching',
    ],
    specialties: [
      'Movement Quality',
      'Injury Prevention',
      'Adaptive Training',
    ],
  },
  // Test coach account for development
  {
    email: 'testcoach@crossfitcomet.com',
    name: 'Test Coach',
    coachId: 'testcoach',
    title: 'Test Coach',
    bio: 'Test coach account for development purposes.',
    certifications: [],
    specialties: [],
  },
];

const DEFAULT_PASSWORD = 'CoachTemp123!';

async function seedCoaches() {
  console.log('Seeding coach accounts...\n');

  for (const coach of coaches) {
    console.log(`Creating ${coach.name}...`);

    try {
      // Check if user already exists
      const { data: existingUsers } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', coach.email)
        .single();

      if (existingUsers) {
        console.log(`  ⚠️  ${coach.email} already exists, updating profile...`);

        // Update existing profile with full data
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            role: 'coach',
            coach_id: coach.coachId,
            full_name: coach.name,
            membership_type: 'crossfit',
            title: coach.title,
            bio: coach.bio,
            certifications: coach.certifications,
            specialties: coach.specialties,
          })
          .eq('email', coach.email);

        if (updateError) {
          console.error(`  ❌ Failed to update profile: ${updateError.message}`);
          continue;
        }

        console.log(`  ✅ Updated ${coach.name} with profile data`);
        continue;
      }

      // Create new auth user (minimal - no metadata to avoid trigger issues)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: coach.email,
        password: DEFAULT_PASSWORD,
        email_confirm: true
      });

      if (authError) {
        console.error(`  ❌ Failed to create auth user: ${authError.message}`);

        // If user exists in auth but not profiles, try to get their ID
        if (authError.message.includes('already') || authError.message.includes('exists')) {
          const { data: authUsers } = await supabase.auth.admin.listUsers();
          const existingUser = authUsers?.users?.find(u => u.email === coach.email);
          if (existingUser) {
            console.log(`  📝 Found existing auth user, updating profile...`);

            // Create/update profile with full data
            const { error: upsertError } = await supabase
              .from('profiles')
              .upsert({
                id: existingUser.id,
                email: coach.email,
                full_name: coach.name,
                role: 'coach',
                coach_id: coach.coachId,
                membership_type: 'crossfit',
                title: coach.title,
                bio: coach.bio,
                certifications: coach.certifications,
                specialties: coach.specialties,
              }, { onConflict: 'id' });

            if (upsertError) {
              console.error(`    ❌ Profile upsert failed: ${upsertError.message}`);
            } else {
              console.log(`  ✅ Updated ${coach.name} with profile data`);
            }
          }
        }
        continue;
      }

      // Update profile with coach role and full data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'coach',
          coach_id: coach.coachId,
          full_name: coach.name,
          membership_type: 'crossfit',
          title: coach.title,
          bio: coach.bio,
          certifications: coach.certifications,
          specialties: coach.specialties,
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error(`  ⚠️  Profile update error: ${profileError.message}`);
      }

      console.log(`  ✅ Created ${coach.name} (${coach.email}) with profile data`);

    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
    }
  }

  console.log('\n-----------------------------------');
  console.log('Coach seeding complete!');
  console.log(`Default password: ${DEFAULT_PASSWORD}`);
  console.log('Coaches should reset their passwords on first login.');
  console.log('Profile data (bio, certifications, specialties) has been populated.');
  console.log('Services can be assigned via Admin > Manage Staff.');
  console.log('-----------------------------------\n');
}

seedCoaches().catch(console.error);
