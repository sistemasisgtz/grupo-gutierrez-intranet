// =========================================================
// GRUPO GUTIERREZ
// SUPABASE CLIENT
//
// MISMO PROYECTO DE SUPABASE QUE INGENIERÍA LO
// =========================================================

(() => {

    "use strict";


    const SUPABASE_URL =
        "https://rdonskstfnraqvjezjmd.supabase.co";


const SUPABASE_KEY =
    "sb_publishable_qSWkjQg778jQuKUFIob_Lg_mvYTPc0J";


    if (
        !window.supabase
        ||
        typeof window.supabase.createClient !== "function"
    ) {

        console.error(
            "[GRUPO GUTIERREZ] Supabase JS no está disponible."
        );

        return;

    }


    window.ggSupabase =
        window.supabase.createClient(

            SUPABASE_URL,

            SUPABASE_KEY,

            {

                auth: {

                    persistSession:
                        true,

                    autoRefreshToken:
                        true,

                    detectSessionInUrl:
                        true

                }

            }

        );

})();