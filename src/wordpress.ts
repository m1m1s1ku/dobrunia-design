import { SVGTemplateResult } from 'lit-element';

export interface WPLink {
  id: string;
  label: string;
  url: string;
  icon?: SVGTemplateResult;
  connectedObject?: {
    taxonomy: {
      node: {
        name: string;
      };
    };
  };
}

export interface WPTerrazzo {
  logo: string;
  [color: string]: string;
}

export interface WPBootstrap {
  menus: WPMenus;
  terrazzo: WPTerrazzo;
}

export interface WPMenus {
  nodes: {
    slug: string;
    menuItems: { nodes: WPLink[] };
  }[];
}
