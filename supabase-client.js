/* Drape Supabase client bridge
 * Safe for browser use: this file contains only the project's publishable key.
 * Never put a Supabase service-role/secret key here.
 */
(function () {
  const SUPABASE_URL = 'https://qjxcibcbrlpymerctouh.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_k5nbTCMFwjOy70DhKC9rdw_zCIlP2XL';

  let clientPromise = null;

  function loadSDK() {
    if (window.supabase) return Promise.resolve(window.supabase);
    if (clientPromise) return clientPromise;

    clientPromise = new Promise(function (resolve, reject) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.onload = function () {
        if (window.supabase) resolve(window.supabase);
        else reject(new Error('Supabase SDK did not load.'));
      };
      script.onerror = function () {
        reject(new Error('Could not load Supabase SDK.'));
      };
      document.head.appendChild(script);
    });

    return clientPromise;
  }

  async function getClient() {
    const sdk = await loadSDK();
    if (!window.DrapeSupabaseClient) {
      window.DrapeSupabaseClient = sdk.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
      );
    }
    return window.DrapeSupabaseClient;
  }

  window.DrapeSupabase = {
    url: SUPABASE_URL,

    async client() {
      return getClient();
    },

    async getUser() {
      const supabase = await getClient();
      const result = await supabase.auth.getUser();
      if (result.error) throw result.error;
      return result.data.user;
    },

    async signIn(email, password) {
      const supabase = await getClient();
      const result = await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      return result.data;
    },

    async signUp(email, password, fullName) {
      const supabase = await getClient();
      const result = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName || '' } }
      });
      if (result.error) throw result.error;
      return result.data;
    },

    async signOut() {
      const supabase = await getClient();
      const result = await supabase.auth.signOut();
      if (result.error) throw result.error;
    },

    async getProfile() {
      const supabase = await getClient();
      const user = await this.getUser();
      if (!user) return null;
      const result = await supabase
        .from('profiles')
        .select('id,email,full_name,avatar_url,credits,plan,created_at,updated_at')
        .eq('id', user.id)
        .single();
      if (result.error) throw result.error;
      return result.data;
    },

    async createTryOnSession(data) {
      const supabase = await getClient();
      const user = await this.getUser();
      if (!user) throw new Error('You must be signed in.');
      const result = await supabase
        .from('try_on_sessions')
        .insert({
          user_id: user.id,
          person_image_url: data.person_image_url || null,
          clothing_image_url: data.clothing_image_url || null,
          status: data.status || 'pending'
        })
        .select()
        .single();
      if (result.error) throw result.error;
      return result.data;
    },

    async updateTryOnSession(id, data) {
      const supabase = await getClient();
      const result = await supabase
        .from('try_on_sessions')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (result.error) throw result.error;
      return result.data;
    },

    async getMyTryOns() {
      const supabase = await getClient();
      const result = await supabase
        .from('try_on_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      if (result.error) throw result.error;
      return result.data;
    },

    async saveResult(data) {
      const supabase = await getClient();
      const user = await this.getUser();
      if (!user) throw new Error('You must be signed in.');
      const result = await supabase
        .from('saved_results')
        .insert({
          user_id: user.id,
          session_id: data.session_id,
          result_image_url: data.result_image_url,
          title: data.title || null
        })
        .select()
        .single();
      if (result.error) throw result.error;
      return result.data;
    },

    async getCreditTransactions() {
      const supabase = await getClient();
      const result = await supabase
        .from('credit_transactions')
        .select('*')
        .order('created_at', { ascending: false });
      if (result.error) throw result.error;
      return result.data;
    },

    onAuthStateChange(callback) {
      return getClient().then(function (supabase) {
        return supabase.auth.onAuthStateChange(callback);
      });
    }
  };
})();
