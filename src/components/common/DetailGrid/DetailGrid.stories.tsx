import type { Meta, StoryObj } from '@storybook/react-vite';
import DetailGrid from './DetailGrid';

const meta = {
  title: 'Common/DetailGrid',
  component: DetailGrid,
  args: {
    items: [
      { label: 'Gym Name', value: 'Iron Forge Fitness', status: 'enabled' },
      { label: 'Custom Domain', value: 'www.ironforge.fit', href: 'https://www.ironforge.fit', status: 'enabled' },
      { label: 'Also available at', value: 'nosweat.fitness/gym/iron-forge', copyValue: 'nosweat.fitness/gym/iron-forge' },
      { label: 'Day passes', value: 'Disabled', status: 'disabled' },
      { label: 'Plan', value: 'Active', status: 'muted' },
    ],
  },
} satisfies Meta<typeof DetailGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
