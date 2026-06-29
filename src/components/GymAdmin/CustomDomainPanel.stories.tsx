import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import CustomDomainPanel from './CustomDomainPanel';
import { withProviders } from '../../../.storybook/decorators';
import { mockAdminUser, mockGym } from '../../../.storybook/mockData';

const meta = {
  title: 'Gym Admin/CustomDomainPanel',
  component: CustomDomainPanel,
  parameters: { layout: 'fullscreen', auth: mockAdminUser },
  decorators: [withProviders],
  args: { gymName: 'Iron Forge Fitness', slug: 'iron-forge', onNameChange: () => {}, onSlugChange: () => {} },
} satisfies Meta<typeof CustomDomainPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrapper = (args: React.ComponentProps<typeof CustomDomainPanel>) => {
  const [name, setName] = useState(args.gymName);
  const [slug, setSlug] = useState(args.slug);
  return <CustomDomainPanel {...args} gymName={name} onNameChange={setName} slug={slug} onSlugChange={setSlug} />;
};

// Verified domain (mock gym has custom_domain_status: 'verified').
export const DomainVerified: Story = { render: (args) => <Wrapper {...args} /> };

// No custom domain configured yet.
export const NotConfigured: Story = {
  parameters: { tenant: { gym: { ...mockGym, custom_domain: null, custom_domain_status: 'none' } } },
  render: (args) => <Wrapper {...args} />,
};

// Pending DNS - shows the CNAME setup instructions.
export const PendingDns: Story = {
  parameters: { tenant: { gym: { ...mockGym, custom_domain_status: 'pending' } } },
  render: (args) => <Wrapper {...args} />,
};
