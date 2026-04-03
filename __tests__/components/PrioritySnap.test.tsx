import { render, screen } from "@testing-library/react";
import { PrioritySnap } from "@/components/games/PrioritySnap";

const mockItems = [
  { id: "a", label: "Task A", weight: 5 },
  { id: "b", label: "Task B", weight: 3 },
  { id: "c", label: "Task C", weight: 1 },
];

describe("PrioritySnap", () => {
  it("renders all items", () => {
    render(<PrioritySnap items={mockItems} onComplete={jest.fn()} />);
    expect(screen.getByText("Task A")).toBeInTheDocument();
    expect(screen.getByText("Task B")).toBeInTheDocument();
    expect(screen.getByText("Task C")).toBeInTheDocument();
  });

  it("shows instruction text", () => {
    render(<PrioritySnap items={mockItems} onComplete={jest.fn()} />);
    expect(screen.getByText(/drag/i)).toBeInTheDocument();
  });
});
