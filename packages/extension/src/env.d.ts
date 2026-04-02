declare module "*.css" {
  const content: string;
  // oxlint-disable-next-line import/no-default-export -- CSS module type declaration
  export default content;
}
