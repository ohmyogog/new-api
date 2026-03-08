/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useEffect, useMemo, useState } from 'react';
import { Bot, BrainCircuit, Orbit, Sparkles } from 'lucide-react';

const modelCards = [
  {
    id: 'openai',
    company: 'OPENAI',
    name: 'GPT 5.3',
    icon: Sparkles,
    toneClass: 'landing-tone-green',
    style: { left: 145, top: 180 },
    delay: '0s',
  },
  {
    id: 'anthropic',
    company: 'ANTHROPIC',
    name: 'opus 4.6',
    icon: BrainCircuit,
    toneClass: 'landing-tone-orange',
    style: { left: 145, top: 300 },
    delay: '0.2s',
  },
  {
    id: 'google',
    company: 'GOOGLE',
    name: 'Gemini 3.1',
    icon: Orbit,
    toneClass: 'landing-tone-blue',
    style: { left: 145, top: 420 },
    delay: '0.4s',
  },
];

const buildCommandText = (serverAddress) => {
  const safeAddress = (serverAddress || window.location.origin).replace(/\/$/, '');
  return `curl ${safeAddress}/v1/chat \\
  -H "Authorization: Bearer $NEWAPI_KEY" \\
  -d '{"model": "auto"}'`;
};

const AnimatedHero = ({ serverAddress }) => {
  const commandText = useMemo(
    () => buildCommandText(serverAddress),
    [serverAddress],
  );
  const [typedCommand, setTypedCommand] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let timeoutId;
    let cursorInterval;
    let cancelled = false;
    let currentIndex = 0;

    const resetLoop = () => {
      currentIndex = 0;
      setTypedCommand('');
      setShowResponse(false);
      timeoutId = window.setTimeout(typeNextChar, 900);
    };

    const typeNextChar = () => {
      if (cancelled) {
        return;
      }

      if (currentIndex < commandText.length) {
        setTypedCommand(commandText.slice(0, currentIndex + 1));
        currentIndex += 1;
        timeoutId = window.setTimeout(typeNextChar, 12 + Math.random() * 24);
        return;
      }

      timeoutId = window.setTimeout(() => {
        setShowResponse(true);
        timeoutId = window.setTimeout(resetLoop, 3400);
      }, 500);
    };

    cursorInterval = window.setInterval(() => {
      setShowCursor((value) => !value);
    }, 520);

    timeoutId = window.setTimeout(typeNextChar, 700);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      window.clearInterval(cursorInterval);
    };
  }, [commandText]);

  return (
    <div className='landing-hero-root'>
      <div className='landing-hero-stage'>
        <svg
          className='landing-hero-lines'
          viewBox='0 0 800 600'
          aria-hidden='true'
        >
          <defs>
            <linearGradient id='landingLineWarm' x1='0%' y1='0%' x2='100%' y2='0%'>
              <stop offset='0%' stopColor='rgba(241, 108, 63, 0.08)' />
              <stop offset='100%' stopColor='rgba(241, 108, 63, 0.52)' />
            </linearGradient>
            <linearGradient id='landingLineSoft' x1='0%' y1='0%' x2='100%' y2='0%'>
              <stop offset='0%' stopColor='rgba(241, 108, 63, 0.55)' />
              <stop offset='100%' stopColor='rgba(241, 108, 63, 0.12)' />
            </linearGradient>
          </defs>

          <path
            id='landingPathTop'
            d='M 250 180 C 310 180, 290 300, 344 300'
            fill='none'
            stroke='url(#landingLineWarm)'
            strokeWidth='1.5'
          />
          <path
            id='landingPathMiddle'
            d='M 250 300 C 310 300, 290 300.1, 344 300'
            fill='none'
            stroke='url(#landingLineWarm)'
            strokeWidth='1.5'
          />
          <path
            id='landingPathBottom'
            d='M 250 420 C 310 420, 290 300, 344 300'
            fill='none'
            stroke='url(#landingLineWarm)'
            strokeWidth='1.5'
          />
          <path
            id='landingPathOut'
            d='M 456 300 L 520 300.1'
            fill='none'
            stroke='url(#landingLineSoft)'
            strokeWidth='1.5'
          />

          {[0, 1, 2].map((index) => (
            <circle key={index} r='3.5' fill='#ff5a36' className='landing-hero-dot'>
              <animateMotion
                dur={`${1.5 + index * 0.2}s`}
                begin={`${index * 0.35}s`}
                repeatCount='indefinite'
              >
                <mpath href={`#${['landingPathTop', 'landingPathMiddle', 'landingPathBottom'][index]}`} />
              </animateMotion>
            </circle>
          ))}

          <circle
            r='4.5'
            fill='#22c55e'
            className={showResponse ? 'landing-hero-dot-active' : 'landing-hero-dot-hidden'}
          >
            <animateMotion dur='1s' begin='0s' repeatCount='indefinite'>
              <mpath href='#landingPathOut' />
            </animateMotion>
          </circle>
        </svg>

        {modelCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.id}
              className='landing-model-card'
              style={card.style}
            >
              <div
                className='landing-model-card-inner'
                style={{ animationDelay: card.delay }}
              >
                <div className={`landing-model-icon ${card.toneClass}`}>
                  <Icon size={20} />
                </div>
                <div className='landing-model-text'>
                  <div className='landing-model-company'>{card.company}</div>
                  <div className='landing-model-name'>{card.name}</div>
                </div>
                <div className='landing-model-status' />
              </div>
            </div>
          );
        })}

        <div className='landing-core-shell'>
          <div className='landing-core-hub'>
            <div className='landing-core-ring landing-core-ring-one' />
            <div className='landing-core-ring landing-core-ring-two' />
            <div className='landing-core-panel'>
              <div className='landing-core-icon'>
                <Bot size={30} />
              </div>
              <div className='landing-core-name'>OGOG.AI</div>
            </div>
          </div>
        </div>

        <div className='landing-terminal-shell'>
          <div className='landing-terminal-inner'>
            <div className='landing-terminal-window'>
              <div className='landing-terminal-titlebar'>
                <div className='landing-terminal-lights'>
                  <span />
                  <span />
                  <span />
                </div>
                <div className='landing-terminal-title'>bash</div>
              </div>

              <div className='landing-terminal-body'>
                <div
                  className='landing-terminal-scroll'
                  style={{ transform: showResponse ? 'translateY(-75px)' : 'translateY(0)' }}
                >
                  <div className='landing-terminal-row'>
                    <span className='landing-terminal-prompt'>$&gt;</span>
                    <span className='landing-terminal-command'>
                      {typedCommand}
                      {showCursor && !showResponse ? (
                        <span className='landing-terminal-caret' />
                      ) : null}
                    </span>
                  </div>

                  {showResponse ? (
                    <div className='landing-terminal-response'>
                      <div className='landing-terminal-meta'>
                        <span className='landing-terminal-code'>200 OK</span>
                        <span>application/json</span>
                        <span>•</span>
                        <span>142ms</span>
                      </div>
                      <pre className='landing-terminal-json'>{`{
  "id": "chat-123",
  "choices": [{
    "message": { "role": "assistant" }
  }]
}`}</pre>
                      <div className='landing-terminal-row landing-terminal-row-end'>
                        <span className='landing-terminal-prompt'>$&gt;</span>
                        {showCursor ? <span className='landing-terminal-caret' /> : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className='landing-terminal-stand' />
            <div className='landing-terminal-base' />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedHero;
