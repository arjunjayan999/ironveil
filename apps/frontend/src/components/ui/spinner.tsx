import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

const sizeStyles = {
	sm: "size-4",
	md: "size-6",
	lg: "size-10",
};

function Spinner({
	size = "md",
	className,
	...props
}: React.ComponentProps<"svg"> & {
	size?: "sm" | "md" | "lg";
}) {
	return (
		<Loader2Icon
			data-slot="spinner"
			role="status"
			aria-label="Loading"
			className={cn(sizeStyles[size], "animate-spin", className)}
			{...props}
		/>
	);
}

export { Spinner };
