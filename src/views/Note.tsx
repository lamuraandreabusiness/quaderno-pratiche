import { percorso } from '../app/rotte';

/** Privacy, avvertenze e crediti. Testi brevi e chiari, senza burocratese. */
export function Note() {
  return (
    <>
      <p className="briciole">
        <a href={percorso.home()}>← Indice</a>
      </p>
      <h1 tabIndex={-1}>Privacy e note</h1>

      <section aria-labelledby="n-dati">
        <h2 id="n-dati">I tuoi dati</h2>
        <p>
          Tutto quello che scrivi nel quaderno (pratiche, registrazioni, note) resta <b>solo su questo dispositivo</b>, nel
          browser. Non c'è un account, non c'è un server che riceve i tuoi dati, nessuno può leggerli.
        </p>
        <p>
          L'app non usa cookie, non traccia le visite, non mostra pubblicità e non contatta servizi esterni: anche i
          caratteri sono contenuti nell'app.
        </p>
        <p>
          L'app è ospitata da GitHub Pages: come ogni sito, quando la scarichi il server può registrare dati tecnici (per
          esempio l'indirizzo IP) nei propri log. Dopo il primo caricamento l'app funziona anche senza rete.
        </p>
        <p>
          Le fonti che aggiungi alle pratiche possono essere link ad altri siti: aprendoli, valgono le regole di quei
          siti.
        </p>
      </section>

      <section aria-labelledby="n-sicurezza">
        <h2 id="n-sicurezza">Come non perderli</h2>
        <p>
          Dato che i dati stanno solo qui, se cancelli i dati del browser o cambi telefono li perdi. Due accorgimenti:
        </p>
        <ul className="elenco-note">
          <li>
            <b>Installa l'app</b> sulla schermata Home. Su iPhone è importante: se il quaderno resta una pagina di Safari
            che non apri per qualche settimana, iOS può cancellarne i dati.
          </li>
          <li>
            <b>Esporta un backup</b> ogni tanto da <a href={percorso.impostazioni()}>Impostazioni</a> e conservalo dove vuoi.
          </li>
        </ul>
      </section>

      <section aria-labelledby="n-avvertenza">
        <h2 id="n-avvertenza">Un'avvertenza</h2>
        <p>
          Le pratiche del quaderno sono strumenti di benessere e crescita personale. <b>Non sono una terapia</b> e non
          sostituiscono il parere di un medico, di uno psicologo o di un altro professionista.
        </p>
        <p>
          Ascolta il tuo corpo: se un esercizio ti dà fastidio, capogiri o dolore, fermati. Se hai problemi di salute,
          sei in gravidanza o stai attraversando un momento difficile, parlane con un professionista prima di iniziare
          pratiche di respirazione o di movimento.
        </p>
      </section>

      <section aria-labelledby="n-crediti">
        <h2 id="n-crediti">Crediti</h2>
        <p>
          Le pratiche della Raccolta sono descritte con parole nostre; quando hanno un autore o una tradizione di
          riferimento lo trovi indicato nella scheda, alla voce «Fonte».
        </p>
        <p>
          Caratteri: Caveat (Impallari Type) e Kalam (Indian Type Foundry), con licenza SIL Open Font License 1.1.
        </p>
      </section>
    </>
  );
}
