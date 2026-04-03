import { render, screen, fireEvent } from "@testing-library/react";
import { BranchingScenario } from "@/components/scenarios/BranchingScenario";

const mockTree = {
  rootNodeId: "root",
  nodes: {
    root: {
      id: "root",
      text: "A problem occurs. What do you do?",
      options: [
        { id: "a", label: "A", text: "Act immediately", consequence: "You resolved it fast.", scores: {} },
        { id: "b", label: "B", text: "Wait and see", consequence: "It got worse.", nextNodeId: "node-b", scores: {} },
      ],
    },
    "node-b": {
      id: "node-b",
      text: "It got worse. Now what?",
      options: [
        { id: "b1", label: "A", text: "Fix it now", consequence: "Better late than never.", scores: {} },
      ],
    },
  },
};

describe("BranchingScenario", () => {
  it("renders the root scenario text", () => {
    render(<BranchingScenario tree={mockTree} onComplete={jest.fn()} />);
    expect(screen.getByText("A problem occurs. What do you do?")).toBeInTheDocument();
  });

  it("shows options as clickable buttons", () => {
    render(<BranchingScenario tree={mockTree} onComplete={jest.fn()} />);
    expect(screen.getByText("Act immediately")).toBeInTheDocument();
    expect(screen.getByText("Wait and see")).toBeInTheDocument();
  });

  it("advances to consequence after choosing", () => {
    render(<BranchingScenario tree={mockTree} onComplete={jest.fn()} />);
    fireEvent.click(screen.getByText("Wait and see"));
    expect(screen.getByText("It got worse.")).toBeInTheDocument();
  });
});
