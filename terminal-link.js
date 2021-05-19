/**
 * NPM package supports-hyperlinks - https://github.com/jamestalmage/supports-hyperlinks
 * @license MIT
 * @author James Talmage
 */

function parseVersion(versionString) {
  if (/^\d{3,4}$/.test(versionString)) {
    // Env var doesn't always use dots. example: 4601 => 46.1.0
    const m = /(\d{1,2})(\d{2})/.exec(versionString);
    return {
      major: 0,
      minor: parseInt(m[1], 10),
      patch: parseInt(m[2], 10)
    };
  }
  
  const versions = (versionString || '').split('.').map(n => parseInt(n, 10));
  return {
    major: versions[0],
    minor: versions[1],
    patch: versions[2]
  };
}

function supportsHyperlinks(stream) {
  const {env} = process;
  
  if ('FORCE_HYPERLINK' in env) {
    return !(env.FORCE_HYPERLINK.length > 0 && parseInt(env.FORCE_HYPERLINK, 10) === 0);
  }
  
  if (hasFlag('no-hyperlink') || hasFlag('no-hyperlinks') || hasFlag('hyperlink=false') || hasFlag('hyperlink=never')) {
    return false;
  }
  
  if (hasFlag('hyperlink=true') || hasFlag('hyperlink=always')) {
    return true;
  }
  
  // If they specify no colors, they probably don't want hyperlinks.
  if (!supportsColor.supportsColor(stream)) {
    return false;
  }
  
  if (stream && !stream.isTTY) {
    return false;
  }
  
  if (process.platform === 'win32') {
    return false;
  }
  
  if ('NETLIFY' in env) {
    return true;
  }
  
  if ('CI' in env) {
    return false;
  }
  
  if ('TEAMCITY_VERSION' in env) {
    return false;
  }
  
  if ('TERM_PROGRAM' in env) {
    const version = parseVersion(env.TERM_PROGRAM_VERSION);
    
    switch (env.TERM_PROGRAM) {
    case 'iTerm.app':
      if (version.major === 3) {
        return version.minor >= 1;
      }
      
      return version.major > 3;
      // No default
    }
  }
  
  if ('VTE_VERSION' in env) {
    // 0.50.0 was supposed to support hyperlinks, but throws a segfault
    if (env.VTE_VERSION === '0.50.0') {
      return false;
    }
    
    const version = parseVersion(env.VTE_VERSION);
    return version.major > 0 || version.minor >= 50;
  }
  
  return false;
}

/**
 * NPM package ansi-escapes - https://github.com/sindresorhus/ansi-escapes/
 * @license MIT
 * @author Sindre Sorhus <sindresorhus@gmail.com>
 */
function ansiEscapesLink(text, url) {
  return [
    OSC,
    '8',
    SEP,
    SEP,
    url,
    BEL,
    text,
    OSC,
    '8',
    SEP,
    SEP,
    BEL
  ].join('');
};

/**
 * NPM package terminal-link
 * @license MIT
 * @author Sindre Sorhus <sindresorhus@gmail.com>
 */
function terminalLink(text, url, {target = 'stdout', ...options} = {}) {
  if (!supportsHyperlinks[target]) {
    // If the fallback has been explicitly disabled, don't modify the text itself.
    if (options.fallback === false) {
      return text;
    }
    
    return typeof options.fallback === 'function' ? options.fallback(text, url) : `${text} (\u200B${url}\u200B)`;
  }
  
  return ansiEscapesLink(text, url);
}

terminalLink.isSupported = supportsHyperlinks.stdout;
terminalLink.stderr = (text, url, options = {}) => terminalLink(text, url, {target: 'stderr', ...options});
terminalLink.stderr.isSupported = supportsHyperlinks.stderr;

module.exports = terminalLink;
