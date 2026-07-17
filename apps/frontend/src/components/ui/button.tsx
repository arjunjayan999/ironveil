import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"group/button inline-flex shrink-0 items-center justify-center rounded-none border border-transparent bg-clip-padding text-xs font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				primary:
					"bg-blue-600 text-white hover:bg-blue-500 disabled:bg-blue-900 disabled:text-blue-600",

				secondary: "bg-gray-700 text-gray-100 hover:bg-gray-600",

				destructive: "bg-red-700 text-white hover:bg-red-600",

				ghost:
					"bg-transparent text-gray-400 hover:text-white hover:bg-gray-800",
				default: "bg-primary text-primary-foreground hover:bg-primary/80",
				outline:
					"border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				sm: "px-3 py-1.5 text-sm",
				md: "px-4 py-2 text-sm",
				xs: "h-6 gap-1 rounded-none px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
				lg: "h-9 gap-1.5 px-2.5",
				icon: "size-8",
				"icon-xs": "size-6",
				"icon-sm": "size-7",
				"icon-lg": "size-9",
			},
		},
		defaultVariants: {
			variant: "primary",
			size: "md",
		},
	},
);

function Button({
	className,
	variant = "primary",
	size = "md",
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot.Root : "button";

	return (
		<Comp
			data-slot="button"
			data-variant={variant}
			data-size={size}
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
