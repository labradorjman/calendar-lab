export type MenuItem = {
    id: string;
    label: string;
    onSelect: () => void;
};

export type MenuState =
    | {
          x: number;
          y: number;
          items: MenuItem[];
      }
    | null;
