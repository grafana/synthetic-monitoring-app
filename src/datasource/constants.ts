export const SM_CLIENT_HEADERS = {
  get 'X-Client-ID'() {
    return process.env.SM_PLUGIN_ID;
  },
  get 'X-Client-Version'() {
    return process.env.SM_PLUGIN_VERSION;
  },
};
