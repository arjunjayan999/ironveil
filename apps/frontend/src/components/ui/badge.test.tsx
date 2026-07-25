import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";

describe("Badge", () => {
	it("renders its children", () => {
		render(<Badge>HIGH</Badge>);

		expect(screen.getByText("HIGH")).toBeInTheDocument();
	});

	it("applies the high variant classes", () => {
		render(<Badge variant="high">HIGH</Badge>);

		expect(screen.getByText("HIGH")).toHaveClass("text-red-400");
		expect(screen.getByText("HIGH")).toHaveClass("border-red-800");
	});

	it("applies the medium variant classes", () => {
		render(<Badge variant="medium">MEDIUM</Badge>);

		expect(screen.getByText("MEDIUM")).toHaveClass("text-amber-400");
	});

	it("applies the low variant classes", () => {
		render(<Badge variant="low">LOW</Badge>);

		expect(screen.getByText("LOW")).toHaveClass("text-green-400");
	});

	it("applies the open variant classes", () => {
		render(<Badge variant="open">OPEN</Badge>);

		expect(screen.getByText("OPEN")).toHaveClass("text-blue-400");
	});

	it("applies the review variant classes", () => {
		render(<Badge variant="review">UNDER REVIEW</Badge>);

		expect(screen.getByText("UNDER REVIEW")).toHaveClass("text-purple-400");
	});

	it("applies the resolved variant classes", () => {
		render(<Badge variant="resolved">RESOLVED</Badge>);

		expect(screen.getByText("RESOLVED")).toHaveClass("text-gray-400");
	});

	it("applies md size classes", () => {
		render(
			<Badge variant="high" size="md">
				HIGH
			</Badge>,
		);

		expect(screen.getByText("HIGH")).toHaveClass("px-3");
		expect(screen.getByText("HIGH")).toHaveClass("text-sm");
	});

	it("applies sm size classes by default", () => {
		render(<Badge>HIGH</Badge>);

		expect(screen.getByText("HIGH")).toHaveClass("px-2");
		expect(screen.getByText("HIGH")).toHaveClass("text-xs");
	});

	it("merges custom className", () => {
		render(<Badge className="custom-class">HIGH</Badge>);

		expect(screen.getByText("HIGH")).toHaveClass("custom-class");
	});

	it("renders as a child element when asChild is true", () => {
		render(
			<Badge asChild variant="high">
				<a href="/test">HIGH</a>
			</Badge>,
		);

		const link = screen.getByRole("link", { name: "HIGH" });

		expect(link.tagName).toBe("A");
		expect(link).toHaveClass("text-red-400");
	});
});
