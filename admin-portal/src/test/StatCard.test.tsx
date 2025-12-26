import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from '../components/StatCard';
import { Users } from 'lucide-react';

describe('StatCard Component', () => {
    it('renders with basic props', () => {
        render(
            <StatCard
                title="Total Users"
                value="150"
                icon={Users}
            />
        );

        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('renders with change text', () => {
        render(
            <StatCard
                title="Total Users"
                value="150"
                change="+5 today"
                icon={Users}
            />
        );

        expect(screen.getByText('+5 today')).toBeInTheDocument();
    });

    it('renders with trend indicator', () => {
        render(
            <StatCard
                title="Total Users"
                value="150"
                change="+5 today"
                trend="up"
                icon={Users}
            />
        );

        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('renders without optional props', () => {
        render(
            <StatCard
                title="Total Users"
                value="150"
                icon={Users}
            />
        );

        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument();
    });
});
