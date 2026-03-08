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
import { Button } from '@douyinfe/semi-ui';
import { IconFile } from '@douyinfe/semi-icons';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Copy, Users, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StatusContext } from '../../context/Status';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { API, copy, getSystemName } from '../../helpers';
import NoticeModal from '../../components/layout/NoticeModal';
import AnimatedHero from '../../components/landing/AnimatedHero';

const Home = () => {
  const { t, i18n } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const isMobile = useIsMobile();
  const [noticeVisible, setNoticeVisible] = useState(false);
  const [isSupportOverlayOpen, setIsSupportOverlayOpen] = useState(false);
  const [copiedWechatId, setCopiedWechatId] = useState(null);
  const docsLink = statusState?.status?.docs_link || '';
  const systemName = getSystemName();
  const serverAddress =
    statusState?.status?.server_address || `${window.location.origin}`;
  const language = i18n.language || 'zh-CN';
  const isEnglishLocale = language.startsWith('en');
  const ogogWechatName = 'ogog.ai';
  const ogogWechatId = 'OGOG_AI';
  const liuyouWechatName = '刘油-ogog.ai中转站';
  const liuyouWechatId = 'Liuyou-zawd';

  const content = useMemo(
    () => ({
      badge: isEnglishLocale
        ? 'New Support: Gemini 3.1 & OPUS 4.6'
        : '全新支持: Gemini 3.1 & OPUS 4.6',
      title1: isEnglishLocale ? "Harnessing the World's Leading AI" : '汇聚全球前沿智能',
      title2: isEnglishLocale ? 'Powering Endless Possibilities' : '驱动无限可能',
      description: isEnglishLocale
        ? 'Access leading models like Claude, GPT, and Gemini through a single, high-performance gateway. Unified developer experience, zero-latency routing, and enterprise-grade security.'
        : '通过单一的高性能网关访问 Claude、GPT 和 Gemini 等领先模型。统一开发者体验，零延迟路由，和企业级安全性。',
      startBuilding: isEnglishLocale ? 'Start Building' : '开始构建',
      viewDocumentation: isEnglishLocale ? 'View Documentation' : '查看文档',
      contactUs: isEnglishLocale ? 'Contact Us' : '联系我们',
      developerFirst: isEnglishLocale ? 'Developer First' : '开发者优先',
      zeroRetention: isEnglishLocale ? 'Zero Retention' : '零数据保留',
      supportTeamDesc: isEnglishLocale
        ? 'Dedicated advisors provide enterprise onboarding plans, volume licensing, and partnership programs to help you move from PoC to production faster.'
        : '专属顾问为你提供企业接入方案、批量授权采购与合作计划，帮助你从 PoC 快速走向生产。',
      salesManagerRole: isEnglishLocale ? 'Sales Manager' : '销售经理',
      teamLeadRole: isEnglishLocale ? 'Head of Sales' : '销售负责人',
      copyAction: isEnglishLocale ? 'Copy' : '复制',
      copiedAction: isEnglishLocale ? 'Copied' : '已复制',
      closeLabel: isEnglishLocale ? 'Close' : '关闭',
    }),
    [isEnglishLocale],
  );

  useEffect(() => {
    if (!isSupportOverlayOpen) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsSupportOverlayOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isSupportOverlayOpen]);

  useEffect(() => {
    const checkNoticeAndShow = async () => {
      const lastCloseDate = localStorage.getItem('notice_close_date');
      const today = new Date().toDateString();
      if (lastCloseDate !== today) {
        try {
          const res = await API.get('/api/notice');
          const data = res.data;
          if (data?.success && data?.data && data.data.trim() !== '') {
            setNoticeVisible(true);
          }
        } catch (error) {
          console.error('获取公告失败:', error);
        }
      }
    };

    checkNoticeAndShow();
  }, []);

  const handleCopyBaseURL = async () => {
    await copy(serverAddress);
  };

  const handleCopyWechatId = async (wechatId) => {
    const ok = await copy(wechatId);
    if (!ok) {
      return;
    }

    setCopiedWechatId(wechatId);
    window.setTimeout(() => {
      setCopiedWechatId((current) => (current === wechatId ? null : current));
    }, 1800);
  };

  const renderContactCard = ({
    avatar,
    avatarAlt,
    qr,
    qrAlt,
    role,
    wechatName,
    wechatId,
  }) => {
    const copied = copiedWechatId === wechatId;

    return (
      <div className='landing-contact-card'>
        <div className='landing-contact-avatar-wrap'>
          <span className='landing-contact-avatar-fallback'>#</span>
          <img
            src={avatar}
            alt={avatarAlt}
            className='landing-contact-avatar'
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        </div>

        <div className='landing-contact-copy'>
          <p className='landing-contact-role'>{role}</p>
          <p className='landing-contact-meta'>微信名：{wechatName}</p>
          <p className='landing-contact-meta landing-contact-id-row'>
            <span>微信号：{wechatId}</span>
            <button
              type='button'
              onClick={() => handleCopyWechatId(wechatId)}
              className='landing-contact-copy-button'
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? content.copiedAction : content.copyAction}
            </button>
          </p>
        </div>

        <div className='landing-contact-qr-shell'>
          <div className='landing-contact-qr-frame'>
            <span className='landing-contact-qr-fallback'>QR</span>
            <img
              src={qr}
              alt={qrAlt}
              className='landing-contact-qr'
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <NoticeModal
        visible={noticeVisible}
        onClose={() => setNoticeVisible(false)}
        isMobile={isMobile}
      />

      <div className='landing-page-shell'>
        <div className='landing-page-backdrop' aria-hidden='true'>
          <div className='landing-page-grid' />
          <div className='landing-page-glow landing-page-glow-left' />
          <div className='landing-page-glow landing-page-glow-right' />
        </div>

        <div className='landing-main-shell'>
          <div className='landing-container'>
            <div className='landing-hero-layout'>
              <div className='landing-hero-copy'>
                <div className='landing-badge-row'>
                  <span className='landing-status-badge'>
                    <span className='landing-status-dot' />
                    {content.badge}
                  </span>
                </div>

                <h1 className='landing-hero-title'>
                  <span className={isEnglishLocale ? 'inline-block' : 'inline-block whitespace-nowrap'}>
                    {content.title1}
                  </span>
                  <br />
                  <span
                    className={`landing-text-gradient ${isEnglishLocale ? 'inline-block' : 'inline-block whitespace-nowrap'}`}
                  >
                    {content.title2}
                  </span>
                </h1>

                <p className='landing-hero-description ogog-hero-description'>
                  {content.description}
                </p>

                <div className='landing-hero-actions'>
                  <Link to='/console' className='landing-action-link'>
                    <span className='landing-primary-button landing-primary-link'>
                      <span>{content.startBuilding}</span>
                      <ArrowRight size={16} />
                    </span>
                  </Link>

                  {docsLink ? (
                    <Button
                      icon={<IconFile />}
                      className='landing-secondary-button'
                      onClick={() => window.open(docsLink, '_blank', 'noopener,noreferrer')}
                    >
                      {content.viewDocumentation}
                    </Button>
                  ) : null}

                  <Button
                    icon={<Users size={16} />}
                    className='landing-tertiary-button'
                    onClick={() => setIsSupportOverlayOpen(true)}
                  >
                    {content.contactUs}
                  </Button>
                </div>

                <div className='landing-signal-row'>
                  <div className='landing-signal-item'>
                    <Check size={16} />
                    <span>{content.developerFirst}</span>
                  </div>
                  <div className='landing-signal-item'>
                    <Check size={16} />
                    <span>{content.zeroRetention}</span>
                  </div>
                </div>
              </div>

              <div className='landing-hero-visual'>
                <AnimatedHero serverAddress={serverAddress} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {isSupportOverlayOpen ? (
        <div
          className='landing-support-overlay'
          onClick={() => setIsSupportOverlayOpen(false)}
        >
          <div className='landing-support-overlay-inner'>
            <div
              className='landing-support-panel glass-panel'
              onClick={(event) => event.stopPropagation()}
            >
              <div className='landing-support-header'>
                <div>
                  <h2 className='landing-support-title'>{content.contactUs}</h2>
                  <p className='landing-support-description'>
                    {content.supportTeamDesc}
                  </p>
                </div>
                <button
                  type='button'
                  aria-label={content.closeLabel}
                  onClick={() => setIsSupportOverlayOpen(false)}
                  className='landing-support-close'
                >
                  <X size={18} />
                </button>
              </div>

              <div className='landing-support-content'>
                {renderContactCard({
                  avatar: '/contact/ogog-avatar.jpg',
                  avatarAlt: 'OGOG_AI avatar',
                  qr: '/contact/ogog-qr.jpg',
                  qrAlt: 'OGOG_AI qr',
                  role: content.salesManagerRole,
                  wechatName: ogogWechatName,
                  wechatId: ogogWechatId,
                })}
                {renderContactCard({
                  avatar: '/contact/liuyou-zawd-avatar.jpg',
                  avatarAlt: 'Liuyou-zawd avatar',
                  qr: '/contact/liuyou-zawd-contact-qr.jpg',
                  qrAlt: 'Liuyou-zawd qr',
                  role: content.teamLeadRole,
                  wechatName: liuyouWechatName,
                  wechatId: liuyouWechatId,
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Home;
