import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as domainApi from "@/api/domain";
import { DomainStatus } from "@/components/DomainStatus";

describe("DomainStatus Component", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
				},
			},
		});
	});

	it("renders domain cards when domains are returned", async () => {
		const mockDomains: domainApi.Domain[] = [
			{
				ID: 1,
				Domain: "example.com",
				Status: "verified",
				VerifyToken: "token",
				CreatedAt: "2026-01-01T00:00:00Z",
				UpdatedAt: "2026-01-01T00:00:00Z",
				expires_in_days: 25,
				BillingData: {
					registrar: "Cloudflare",
					endDate: "2027-01-01T00:00:00Z",
					renewalPrice: "$10",
					notes: "tag1;tag2",
				},
			},
		];

		vi.spyOn(domainApi, "getDomains").mockResolvedValue(mockDomains);

		render(
			<QueryClientProvider client={queryClient}>
				<DomainStatus />
			</QueryClientProvider>,
		);

		expect(await screen.findByText("example.com")).toBeInTheDocument();
		expect(screen.getByText("Cloudflare")).toBeInTheDocument();
		expect(screen.getByText("$10")).toBeInTheDocument();
	});

	it("renders nothing when no domains exist", async () => {
		vi.spyOn(domainApi, "getDomains").mockResolvedValue([]);

		const { container } = render(
			<QueryClientProvider client={queryClient}>
				<DomainStatus />
			</QueryClientProvider>,
		);

		expect(container.firstChild).toBeNull();
	});
});
