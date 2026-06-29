import type { Meta, StoryObj } from '@storybook/react-vite';
import GradientText from './GradientText';

const meta = {
  title: 'Common/GradientText',
  component: GradientText,
  argTypes: {
    as: { control: 'inline-radio', options: ['h1', 'h2', 'h3', 'h4', 'span', 'p'] },
    gradient: { control: 'inline-radio', options: ['accent', 'secondary', 'warm', 'cool'] },
    children: { control: 'text' },
  },
  args: { children: 'Forge Your Strength', as: 'h1', gradient: 'accent' },
} satisfies Meta<typeof GradientText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Accent: Story = {};
export const Secondary: Story = { args: { gradient: 'secondary' } };
export const Warm: Story = { args: { gradient: 'warm' } };
export const Cool: Story = { args: { gradient: 'cool' } };
