import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
	it("renders children", () => {
		render(<Button>Click me</Button>);

		expect(
			screen.getByRole("button", { name: "Click me" }),
		).toBeInTheDocument();
	});

	it("calls onClick when clicked", async () => {
		const handleClick = vi.fn();

		render(<Button onClick={handleClick}>Click</Button>);

		await userEvent.click(screen.getByRole("button"));

		expect(handleClick).toHaveBeenCalledOnce();
	});

	it("does not call onClick when disabled", async () => {
		const handleClick = vi.fn();

		render(
			<Button disabled onClick={handleClick}>
				Click
			</Button>,
		);

		await userEvent.click(screen.getByRole("button"));

		expect(handleClick).not.toHaveBeenCalled();
	});

	it("applies the primary variant by default", () => {
		render(<Button>Primary</Button>);

		expect(screen.getByRole("button")).toHaveClass("bg-blue-600", "text-white");
	});

	it("applies the destructive variant", () => {
		render(<Button variant="destructive">Delete</Button>);

		expect(screen.getByRole("button")).toHaveClass("bg-red-700", "text-white");
	});

	it("applies the secondary variant", () => {
		render(<Button variant="secondary">Cancel</Button>);

		expect(screen.getByRole("button")).toHaveClass(
			"bg-gray-700",
			"text-gray-100",
		);
	});

	it("is disabled when disabled is passed", () => {
		render(<Button disabled>Disabled</Button>);

		expect(screen.getByRole("button")).toBeDisabled();
	});

	it("renders a submit button", () => {
		render(<Button type="submit">Submit</Button>);

		expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
	});

	it("applies the default md size", () => {
		render(<Button>Button</Button>);

		expect(screen.getByRole("button")).toHaveClass("px-4", "py-2");
	});

	it("applies the sm size", () => {
		render(<Button size="sm">Button</Button>);

		expect(screen.getByRole("button")).toHaveClass("px-3", "py-1.5");
	});

	it("merges custom className", () => {
		render(<Button className="custom-class">Button</Button>);

		expect(screen.getByRole("button")).toHaveClass("custom-class");
	});

	it("renders as its child when asChild is true", () => {
		render(
			<Button asChild variant="primary">
				<a href="/test">Link Button</a>
			</Button>,
		);

		const link = screen.getByRole("link", { name: "Link Button" });

		expect(link.tagName).toBe("A");
		expect(link).toHaveClass("bg-blue-600");
	});
});
