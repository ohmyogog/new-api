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

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getFooterHTML, getLogo, getSystemName } from '../../helpers';
import { StatusContext } from '../../context/Status';

const FooterBar = () => {
  const { t } = useTranslation();
  const [footer, setFooter] = useState(getFooterHTML());
  const systemName = getSystemName();
  const logo = getLogo();
  const [statusState] = useContext(StatusContext);
  const docsLink = statusState?.status?.docs_link || '';
  const isDemoSiteMode = statusState?.status?.demo_site_enabled || false;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const footerHtml = localStorage.getItem('footer_html');
    if (footerHtml) {
      setFooter(footerHtml);
    }
  }, []);

  const footerLinks = useMemo(
    () => [
      { key: 'home', label: t('首页'), to: '/' },
      { key: 'console', label: t('控制台'), to: '/console' },
      { key: 'pricing', label: t('模型广场'), to: '/pricing' },
    ],
    [t],
  );

  const defaultFooter = (
    <footer className='landing-footer-shell'>
      <div className='landing-footer-frame'>
        <div className='landing-footer-brand'>
          <div className='landing-footer-logo-wrap'>
            <img src={logo} alt={systemName} className='landing-footer-logo' />
          </div>
          <div>
            <div className='landing-footer-name'>{systemName}</div>
            <div className='landing-footer-copy'>
              {isDemoSiteMode
                ? t('用于演示统一 AI 网关体验与控制台能力。')
                : t('为团队提供统一的大模型接入、治理与交付入口。')}
            </div>
          </div>
        </div>

        <div className='landing-footer-links'>
          {footerLinks.map((item) => (
            <Link key={item.key} to={item.to} className='landing-footer-link'>
              {item.label}
            </Link>
          ))}
          {docsLink ? (
            <a
              href={docsLink}
              target='_blank'
              rel='noopener noreferrer'
              className='landing-footer-link'
            >
              <span>{t('文档')}</span>
              <ArrowUpRight size={14} />
            </a>
          ) : null}
          <a
            href='https://github.com/QuantumNous/new-api'
            target='_blank'
            rel='noopener noreferrer'
            className='landing-footer-link'
          >
            <span>GitHub</span>
            <ArrowUpRight size={14} />
          </a>
        </div>

        <div className='landing-footer-meta'>
          <span>
            © {currentYear} {systemName}. {t('版权所有')}
          </span>
          <span>
            {t('设计与开发由')}{' '}
            <a
              href='https://github.com/QuantumNous/new-api'
              target='_blank'
              rel='noopener noreferrer'
              className='landing-footer-credit'
            >
              New API
            </a>
          </span>
        </div>
      </div>
    </footer>
  );

  return footer ? (
    <div className='w-full'>
      <div className='relative'>
        <div className='custom-footer' dangerouslySetInnerHTML={{ __html: footer }} />
        <div className='absolute bottom-2 right-4 text-xs !text-semi-color-text-2 opacity-70'>
          <span>{t('设计与开发由')} </span>
          <a
            href='https://github.com/QuantumNous/new-api'
            target='_blank'
            rel='noopener noreferrer'
            className='!text-semi-color-primary font-medium'
          >
            New API
          </a>
        </div>
      </div>
    </div>
  ) : (
    defaultFooter
  );
};

export default FooterBar;
