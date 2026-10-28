import { defineConfig } from "vite";
import { resolve } from "node:path";
import { cpSync, existsSync } from "node:fs";

export default defineConfig({

    build: {

        rollupOptions: {

            input: {

                main:
                    resolve(
                        __dirname,
                        "index.html"
                    ),

                sistema:
                    resolve(
                        __dirname,
                        "sistema.html"
                    ),

                recursosHumanos:
                    resolve(
                        __dirname,
                        "recursos-humanos.html"
                    ),

                yo:
                    resolve(
                        __dirname,
                        "yo.html"
                    ),

                miPerfilNotificaciones: resolve(__dirname, "mi-perfil-notificaciones.html")

            }

        }

    },


    plugins: [

        {

            name:
                "copy-classic-js",

            closeBundle() {

                const source =
                    resolve(
                        __dirname,
                        "js"
                    );

                const destination =
                    resolve(
                        __dirname,
                        "dist",
                        "js"
                    );


                if (
                    existsSync(
                        source
                    )
                ) {

                    cpSync(
                        source,
                        destination,
                        {
                            recursive:
                                true
                        }
                    );

                }

            }

        }

    ]

});