import type { Meta, StoryObj } from '@storybook/react-vite';
import InfoBox from './InfoBox';

const meta = {
  title: 'Common/InfoBox',
  component: InfoBox,
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'accent'] },
    title: { control: 'text' },
  },
  args: {
    title: 'How it works',
    variant: 'accent',
    children: 'Point your domain at your gym site - we handle SSL and verification automatically.',
  },
} satisfies Meta<typeof InfoBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Accent: Story = {};
export const Default: Story = { args: { variant: 'default', title: 'Note' } };
export const NoTitle: Story = { args: { title: undefined } };
