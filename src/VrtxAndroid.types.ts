export type VrtxAndroidModuleEvents = {
  onSuccess: () => void;
  onError: (params: { code: string; message: string }) => void;
};
