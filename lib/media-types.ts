export type VisualImage = { src: string; width: number; height: number; alt: string };
export type VisualPage = { page: number; images: VisualImage[]; text?: string; imageOnly?: boolean };
export type VisualDocument = {
  representation: 'page' | 'slide-images';
  sourceType: 'pdf' | 'pptx';
  filename: string;
  week: number;
  pages: VisualPage[];
};
export type PageContext = { docId: string; page: number };
