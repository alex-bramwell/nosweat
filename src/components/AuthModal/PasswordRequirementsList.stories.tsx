import type { Meta, StoryObj } from '@storybook/react-vite';
import PasswordRequirementsList from './PasswordRequirementsList';

const meta = {
  title: 'Auth/PasswordRequirementsList',
  component: PasswordRequirementsList,
  args: {
    requirements: { minLength: true, hasUppercase: true, hasLowercase: true, hasNumber: false, hasSpecial: false },
  },
} satisfies Meta<typeof PasswordRequirementsList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PartiallyMet: Story = {};
export const AllMet: Story = {
  args: { requirements: { minLength: true, hasUppercase: true, hasLowercase: true, hasNumber: true, hasSpecial: true } },
};
export const NoneMet: Story = {
  args: { requirements: { minLength: false, hasUppercase: false, hasLowercase: false, hasNumber: false, hasSpecial: false } },
};
