import { useEffect } from 'react';

export default function Comments(): JSX.Element {
  useEffect(() => {
    const script = document.createElement('script');
    const anchor = document.getElementById('inject-comments-for-uterances');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', 'true');
    script.setAttribute('repo', 'hugo-marcelo/desafio05-trilha-reactjs');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', 'github-light');
    anchor.appendChild(script);
  }, []);

  return (
    <>
      <h2>Comentários do post:</h2>
      <div id="inject-comments-for-uterances" />
    </>
  );
}
