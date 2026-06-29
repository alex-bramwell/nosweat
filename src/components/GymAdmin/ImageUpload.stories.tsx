import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import ImageUpload from './ImageUpload';

const meta = {
  title: 'Gym Admin/ImageUpload',
  component: ImageUpload,
  args: {
    label: 'Logo',
    description: 'Use a transparent PNG, around 240px tall.',
    value: '',
    gymId: 'gym-1',
    assetType: 'logo',
    onUpload: () => {},
    onRemove: () => {},
  },
} satisfies Meta<typeof ImageUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

const Interactive = (args: React.ComponentProps<typeof ImageUpload>) => {
  const [value, setValue] = useState(args.value);
  return <div style={{ maxWidth: 420 }}><ImageUpload {...args} value={value} onUpload={setValue} onRemove={() => setValue('')} /></div>;
};

export const Empty: Story = { render: (args) => <Interactive {...args} /> };

export const WithImage: Story = {
  args: {
    label: 'Hero Background',
    description: 'Recommended 1920x1080px.',
    value: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    assetType: 'hero_image',
  },
  render: (args) => <Interactive {...args} />,
};
