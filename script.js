// ===== 전역 변수 및 설정 =====
const CONFIG = {
    ANIMATION_DELAY: 100,
    SCROLL_OFFSET: 100,
    DEBOUNCE_DELAY: 100,
    INTERSECTION_THRESHOLD: 0.1
};

// ===== 유틸리티 함수들 =====
class Utils {
    // 디바운스 함수
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 쓰로틀 함수
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // 요소가 뷰포트에 있는지 확인
    static isInViewport(element, offset = 0) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= -offset &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // 부드러운 스크롤
    static smoothScrollTo(target, offset = 0) {
        const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
        if (!targetElement) return;

        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }

    // 지연 실행
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 랜덤 지연
    static randomDelay(min = 50, max = 200) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

// ===== 애니메이션 컨트롤러 =====
class AnimationController {
    constructor() {
        this.observer = null;
        this.animatedElements = new Set();
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.observeElements();
        this.setupProgressBars();
    }

    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) {
            // 브라우저가 IntersectionObserver를 지원하지 않는 경우 폴백
            this.fallbackAnimation();
            return;
        }

        const options = {
            threshold: CONFIG.INTERSECTION_THRESHOLD,
            rootMargin: '50px 0px -50px 0px'
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
                    this.animateElement(entry.target);
                    this.animatedElements.add(entry.target);
                }
            });
        }, options);
    }

    observeElements() {
        const elementsToAnimate = document.querySelectorAll(`
            .feature-card,
            .audience-item,
            .content-card,
            .schedule-card,
            .benefit-card,
            .material-item,
            .faq-item,
            .instructor-box,
            .promotion-box,
            .section h2
        `);

        elementsToAnimate.forEach(element => {
            if (this.observer) {
                this.observer.observe(element);
            }
        });
    }

    async animateElement(element) {
        // 랜덤 지연으로 자연스러운 애니메이션
        await Utils.delay(Utils.randomDelay());
        
        element.classList.add('fade-in');
        
        // 스탯 프로그레스 바 애니메이션
        if (element.classList.contains('feature-card')) {
            this.animateProgressBar(element);
        }
    }

    animateProgressBar(card) {
        const progressBar = card.querySelector('.stat-progress-bar');
        if (progressBar) {
            const width = progressBar.style.width;
            progressBar.style.width = '0%';
            
            setTimeout(() => {
                progressBar.style.width = width;
            }, 300);
        }
    }

    setupProgressBars() {
        // 페이지 로드 시 프로그레스 바 애니메이션 설정
        const progressBars = document.querySelectorAll('.stat-progress-bar');
        progressBars.forEach(bar => {
            const originalWidth = bar.style.width;
            bar.style.width = '0%';
            bar.dataset.targetWidth = originalWidth;
        });
    }

    fallbackAnimation() {
        // IntersectionObserver를 지원하지 않는 브라우저용 폴백
        const elements = document.querySelectorAll('.feature-card, .audience-item, .content-card');
        elements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add('fade-in');
            }, index * CONFIG.ANIMATION_DELAY);
        });
    }
}

// ===== FAQ 아코디언 컨트롤러 =====
class FAQController {
    constructor() {
        this.faqItems = document.querySelectorAll('.faq-item');
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupKeyboardNavigation();
    }

    bindEvents() {
        this.faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            if (question) {
                question.addEventListener('click', (e) => this.toggleFAQ(e, item));
                question.addEventListener('keydown', (e) => this.handleKeyboard(e, item));
            }
        });
    }

    toggleFAQ(event, item) {
        event.preventDefault();
        
        const isActive = item.classList.contains('active');
        
        // 다른 모든 FAQ 아이템 닫기 (아코디언 효과)
        this.faqItems.forEach(faqItem => {
            if (faqItem !== item) {
                faqItem.classList.remove('active');
            }
        });
        
        // 현재 아이템 토글
        item.classList.toggle('active', !isActive);
        
        // 접근성을 위한 aria 속성 업데이트
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        if (question && answer) {
            const expanded = !isActive;
            question.setAttribute('aria-expanded', expanded);
            answer.setAttribute('aria-hidden', !expanded);
        }
    }

    handleKeyboard(event, item) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.toggleFAQ(event, item);
        }
    }

    setupKeyboardNavigation() {
        this.faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            if (question) {
                question.setAttribute('tabindex', '0');
                question.setAttribute('role', 'button');
                question.setAttribute('aria-expanded', 'false');
                
                const answer = item.querySelector('.faq-answer');
                if (answer) {
                    answer.setAttribute('aria-hidden', 'true');
                }
            }
        });
    }
}

// ===== 스크롤 효과 컨트롤러 =====
class ScrollController {
    constructor() {
        this.lastScrollY = window.scrollY;
        this.ticking = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupSmoothScrolling();
    }

    bindEvents() {
        // 쓰로틀된 스크롤 이벤트
        window.addEventListener('scroll', Utils.throttle(() => {
            this.handleScroll();
        }, 16)); // 60fps

        // 해시 링크 스무스 스크롤
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link) {
                this.handleHashLink(e, link);
            }
        });
    }

    handleScroll() {
        if (!this.ticking) {
            requestAnimationFrame(() => {
                this.updateScrollEffects();
                this.ticking = false;
            });
            this.ticking = true;
        }
    }

    updateScrollEffects() {
        const currentScrollY = window.scrollY;
        
        // 패럴랙스 효과 (헤더 장식)
        const headerDecoration = document.querySelector('.header-decoration');
        if (headerDecoration) {
            const speed = currentScrollY * 0.1;
            headerDecoration.style.transform = `translateY(${speed}px) rotate(${speed * 0.5}deg)`;
        }

        // 기술 측정 장식 애니메이션
        const measurements = document.querySelectorAll('.measurement-line');
        measurements.forEach((line, index) => {
            const speed = (currentScrollY * (0.05 + index * 0.01));
            line.style.transform = `translateX(${speed}px)`;
        });

        this.lastScrollY = currentScrollY;
    }

    handleHashLink(event, link) {
        const href = link.getAttribute('href');
        if (href === '#' || !href) return;

        const target = document.querySelector(href);
        if (target) {
            event.preventDefault();
            Utils.smoothScrollTo(target, CONFIG.SCROLL_OFFSET);
        }
    }

    setupSmoothScrolling() {
        // 전역 스무스 스크롤 설정
        if ('scrollBehavior' in document.documentElement.style) {
            document.documentElement.style.scrollBehavior = 'smooth';
        }
    }
}

// ===== 폼 컨트롤러 =====
class FormController {
    constructor() {
        this.ctaButtons = document.querySelectorAll('.cta-btn');
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupFormValidation();
    }

    bindEvents() {
        this.ctaButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleCTAClick(e, button));
        });

        // 연락처 정보 클릭 시 복사
        const contactValues = document.querySelectorAll('.contact-value');
        contactValues.forEach(value => {
            if (value.textContent.includes('@') || value.textContent.includes('www.')) {
                value.style.cursor = 'pointer';
                value.addEventListener('click', () => this.copyToClipboard(value.textContent));
            }
        });
    }

    async handleCTAClick(event, button) {
        // 기본 동작 방지
        event.preventDefault();
        
        const originalText = button.innerHTML;
        const isPrimary = button.classList.contains('primary');
        
        try {
            // 로딩 상태
            button.classList.add('loading');
            button.innerHTML = isPrimary ? 
                '<i class="fas fa-spinner fa-spin"></i><span>처리중...</span>' : 
                '<i class="fas fa-spinner fa-spin"></i><span>연결중...</span>';
            
            // 실제 폼 제출 또는 연락처 연결 로직
            await this.simulateFormSubmission();
            
            // 성공 상태
            button.innerHTML = isPrimary ? 
                '<i class="fas fa-check"></i><span>신청 완료!</span>' : 
                '<i class="fas fa-check"></i><span>연결됨!</span>';
            
            // 성공 메시지
            this.showNotification(isPrimary ? 
                '신청이 완료되었습니다. 담당자가 연락드리겠습니다.' : 
                '문의 페이지로 연결됩니다.', 'success');
            
            // 원래 상태로 복구
            setTimeout(() => {
                button.innerHTML = originalText;
                button.classList.remove('loading');
            }, 2000);
            
        } catch (error) {
            // 에러 처리
            button.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>다시 시도</span>';
            this.showNotification('오류가 발생했습니다. 직접 연락 부탁드립니다.', 'error');
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.classList.remove('loading');
            }, 2000);
        }
    }

    async simulateFormSubmission() {
        // 실제 환경에서는 서버로 데이터 전송
        await Utils.delay(1500);
        
        // 성공률 90% 시뮬레이션
        if (Math.random() > 0.9) {
            throw new Error('Network error');
        }
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification(`${text}가 클립보드에 복사되었습니다.`, 'info');
        } catch (err) {
            console.warn('클립보드 복사 실패:', err);
            this.showNotification('수동으로 복사해주세요.', 'warning');
        }
    }

    showNotification(message, type = 'info') {
        // 기존 알림 제거
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // 새 알림 생성
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // 스타일 적용
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: this.getNotificationColor(type),
            color: 'white',
            padding: '15px 20px',
            borderRadius: '8px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            maxWidth: '300px',
            fontSize: '14px'
        });

        // DOM에 추가
        document.body.appendChild(notification);

        // 애니메이션
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // 닫기 버튼 이벤트
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.hideNotification(notification);
        });

        // 자동 제거
        setTimeout(() => {
            this.hideNotification(notification);
        }, 5000);
    }

    hideNotification(notification) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getNotificationColor(type) {
        const colors = {
            success: '#10B981',
            error: '#F43F5E',
            warning: '#F59E0B',
            info: '#2563EB'
        };
        return colors[type] || '#2563EB';
    }

    setupFormValidation() {
        // 이메일 링크 검증 및 설정
        const emailLinks = document.querySelectorAll('a[href*="@"], .contact-value');
        emailLinks.forEach(link => {
            const text = link.textContent;
            if (text.includes('@') && !link.href) {
                link.href = `mailto:${text}`;
            }
        });
    }
}

// ===== 성능 최적화 컨트롤러 =====
class PerformanceController {
    constructor() {
        this.lazyImages = [];
        this.init();
    }

    init() {
        this.setupLazyLoading();
        this.optimizeAnimations();
        this.setupPrefetch();
    }

    setupLazyLoading() {
        const images = document.querySelectorAll('img[src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.classList.add('fade-in');
                        imageObserver.unobserve(img);
                    }
                });
            });

            images.forEach(img => {
                imageObserver.observe(img);
            });
        } else {
            // 폴백: 모든 이미지 즉시 로드
            images.forEach(img => {
                img.classList.add('fade-in');
            });
        }
    }

    optimizeAnimations() {
        // 사용자가 애니메이션 감소를 선호하는 경우
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.body.classList.add('reduced-motion');
        }

        // 배터리 수준이 낮은 경우 애니메이션 감소
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                if (battery.level < 0.2) {
                    document.body.classList.add('low-battery');
                }
            });
        }

        // 저성능 디바이스 감지
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
            document.body.classList.add('low-performance');
        }
    }

    setupPrefetch() {
        // 중요한 리소스 미리 로드
        const criticalImages = document.querySelectorAll('.instructor-img');
        criticalImages.forEach(img => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = img.src;
            document.head.appendChild(link);
        });
    }
}

// ===== 접근성 컨트롤러 =====
class AccessibilityController {
    constructor() {
        this.init();
    }

    init() {
        this.setupKeyboardNavigation();
        this.setupARIALabels();
        this.setupFocusManagement();
        this.setupScreenReaderSupport();
    }

    setupKeyboardNavigation() {
        // 카드들에 키보드 네비게이션 추가
        const interactiveCards = document.querySelectorAll(`
            .feature-card,
            .content-card,
            .schedule-card,
            .benefit-card
        `);

        interactiveCards.forEach((card, index) => {
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'article');
            
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });
        });

        // 전역 키보드 단축키
        document.addEventListener('keydown', (e) => {
            // Alt + H: 헤더로 이동
            if (e.altKey && e.key === 'h') {
                e.preventDefault();
                const header = document.querySelector('.header');
                if (header) {
                    header.scrollIntoView({ behavior: 'smooth' });
                    header.focus();
                }
            }

            // Alt + M: 메인 콘텐츠로 이동
            if (e.altKey && e.key === 'm') {
                e.preventDefault();
                const main = document.querySelector('.section');
                if (main) {
                    main.scrollIntoView({ behavior: 'smooth' });
                    main.focus();
                }
            }

            // Alt + F: 푸터로 이동
            if (e.altKey && e.key === 'f') {
                e.preventDefault();
                const footer = document.querySelector('.footer');
                if (footer) {
                    footer.scrollIntoView({ behavior: 'smooth' });
                    footer.focus();
                }
            }
        });
    }

    setupARIALabels() {
        // 섹션들에 적절한 ARIA 레이블 추가
        const sections = document.querySelectorAll('.section');
        sections.forEach((section, index) => {
            const heading = section.querySelector('h2');
            if (heading) {
                const headingText = heading.textContent.trim();
                section.setAttribute('aria-labelledby', `section-${index}`);
                heading.id = `section-${index}`;
                section.setAttribute('aria-label', headingText);
            }
        });

        // 통계 수치에 설명 추가
        const statValues = document.querySelectorAll('.stat-value, .benefit-stat');
        statValues.forEach(stat => {
            const value = stat.textContent;
            const unit = stat.dataset.unit || '';
            const card = stat.closest('.feature-card, .benefit-card');
            const title = card ? card.querySelector('.feature-title, .benefit-title')?.textContent : '';
            
            stat.setAttribute('aria-label', `${title}: ${value}${unit}`);
        });

        // 연락처 정보에 레이블 추가
        const contactItems = document.querySelectorAll('.contact-item');
        contactItems.forEach(item => {
            const label = item.querySelector('.contact-label');
            const value = item.querySelector('.contact-value');
            if (label && value) {
                value.setAttribute('aria-label', `${label.textContent}: ${value.textContent}`);
            }
        });
    }

    setupFocusManagement() {
        // 포커스 트랩 (모달이나 중요한 섹션에서)
        const ctaButtons = document.querySelectorAll('.cta-btn');
        ctaButtons.forEach(button => {
            button.addEventListener('focus', () => {
                button.style.outline = '3px solid var(--tech-accent)';
                button.style.outlineOffset = '2px';
            });

            button.addEventListener('blur', () => {
                button.style.outline = '';
                button.style.outlineOffset = '';
            });
        });

        // 건너뛰기 링크 추가
        this.addSkipLinks();
    }

    addSkipLinks() {
        const skipNav = document.createElement('div');
        skipNav.className = 'skip-navigation';
        skipNav.innerHTML = `
            <a href="#main-content" class="skip-link">주요 내용으로 건너뛰기</a>
            <a href="#contact" class="skip-link">연락처로 건너뛰기</a>
        `;

        // 스타일 적용
        skipNav.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            z-index: 1000;
        `;

        const skipLinks = skipNav.querySelectorAll('.skip-link');
        skipLinks.forEach(link => {
            link.style.cssText = `
                position: absolute;
                left: -10000px;
                top: auto;
                width: 1px;
                height: 1px;
                overflow: hidden;
                background: var(--tech-primary);
                color: white;
                padding: 8px 12px;
                text-decoration: none;
                border-radius: 4px;
                font-weight: bold;
                transition: all 0.3s ease;
            `;

            link.addEventListener('focus', () => {
                link.style.cssText += `
                    position: static;
                    width: auto;
                    height: auto;
                    overflow: visible;
                    left: auto;
                `;
            });
        });

        document.body.insertBefore(skipNav, document.body.firstChild);

        // 메인 콘텐츠에 ID 추가
        const firstSection = document.querySelector('.section');
        if (firstSection) {
            firstSection.id = 'main-content';
        }

        const contactBox = document.querySelector('.contact-box');
        if (contactBox) {
            contactBox.id = 'contact';
        }
    }

    setupScreenReaderSupport() {
        // 라이브 리전 설정
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'live-region';
        document.body.appendChild(liveRegion);

        // 페이지 로드 완료 알림
        window.addEventListener('load', () => {
            setTimeout(() => {
                liveRegion.textContent = 'AI 실무활용 마스터 과정 페이지가 로드되었습니다. 신청 문의는 페이지 하단에서 가능합니다.';
            }, 1000);
        });
    }
}

// ===== 메인 애플리케이션 클래스 =====
class AIEducationApp {
    constructor() {
        this.controllers = {};
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            // DOM이 완전히 로드될 때까지 대기
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // 컨트롤러들 초기화
            this.controllers.animation = new AnimationController();
            this.controllers.faq = new FAQController();
            this.controllers.scroll = new ScrollController();
            this.controllers.form = new FormController();
            this.controllers.performance = new PerformanceController();
            this.controllers.accessibility = new AccessibilityController();

            // 전역 이벤트 리스너 설정
            this.setupGlobalEvents();

            // 초기화 완료 표시
            this.isInitialized = true;
            this.announceReadiness();

            console.log('🚀 AI Education Landing Page가 성공적으로 초기화되었습니다!');

        } catch (error) {
            console.error('❌ 초기화 중 오류 발생:', error);
            this.handleInitError(error);
        }
    }

    setupGlobalEvents() {
        // 윈도우 리사이즈 이벤트
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, CONFIG.DEBOUNCE_DELAY));

        // 페이지 가시성 변경 이벤트
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // 에러 핸들링
        window.addEventListener('error', (event) => {
            this.handleGlobalError(event);
        });

        // 언핸들드 프로미스 리젝션
        window.addEventListener('unhandledrejection', (event) => {
            this.handleUnhandledRejection(event);
        });
    }

    handleResize() {
        // 리사이즈 시 필요한 재계산
        if (this.controllers.animation) {
            this.controllers.animation.setupProgressBars();
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            // 페이지가 숨겨졌을 때 애니메이션 일시 정지
            document.body.classList.add('page-hidden');
        } else {
            // 페이지가 다시 보일 때 애니메이션 재개
            document.body.classList.remove('page-hidden');
        }
    }

    handleGlobalError(event) {
        console.error('전역 에러:', event.error);
        
        // 사용자에게 에러 알림 (개발 모드에서만)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            this.controllers.form?.showNotification(
                '개발 중 오류가 발생했습니다. 콘솔을 확인해주세요.',
                'error'
            );
        }
    }

    handleUnhandledRejection(event) {
        console.error('처리되지 않은 Promise 거부:', event.reason);
        event.preventDefault(); // 기본 에러 로깅 방지
    }

 handleInitError(error) {
        // 초기화 실패 시 기본 기능만 제공
        document.body.classList.add('fallback-mode');
        
        // 기본 FAQ 기능
        const faqQuestions = document.querySelectorAll('.faq-question');
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const item = question.closest('.faq-item');
                item.classList.toggle('active');
            });
        });

        // 기본 스무스 스크롤
        const links = document.querySelectorAll('a[href^="#"]');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // 사용자에게 제한된 기능 알림
        setTimeout(() => {
            const notification = document.createElement('div');
            notification.textContent = '일부 고급 기능이 제한됩니다. 기본 기능은 정상 작동합니다.';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #F59E0B;
                color: white;
                padding: 10px 20px;
                border-radius: 6px;
                z-index: 9999;
                font-size: 14px;
            `;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 5000);
        }, 1000);
    }

    announceReadiness() {
        // 페이지 로드 완료 이벤트 발송
        const readyEvent = new CustomEvent('aiEducationReady', {
            detail: {
                controllers: Object.keys(this.controllers),
                timestamp: Date.now()
            }
        });
        
        document.dispatchEvent(readyEvent);

        // 개발자를 위한 전역 객체 노출
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            window.AIEducationApp = this;
            console.log('🔧 개발 모드: window.AIEducationApp으로 접근 가능');
        }
    }

    // 공개 API 메서드들
    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId) || document.querySelector(sectionId);
        if (section && this.controllers.scroll) {
            Utils.smoothScrollTo(section, CONFIG.SCROLL_OFFSET);
        }
    }

    toggleFAQ(index) {
        if (this.controllers.faq) {
            const faqItems = document.querySelectorAll('.faq-item');
            if (faqItems[index]) {
                const question = faqItems[index].querySelector('.faq-question');
                if (question) {
                    question.click();
                }
            }
        }
    }

    showNotification(message, type = 'info') {
        if (this.controllers.form) {
            this.controllers.form.showNotification(message, type);
        }
    }

    // 디버깅 메서드들
    getStatus() {
        return {
            initialized: this.isInitialized,
            controllers: Object.keys(this.controllers),
            performance: {
                memoryUsage: performance.memory ? {
                    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
                    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB'
                } : 'N/A',
                timing: performance.timing
            }
        };
    }

    destroy() {
        // 정리 작업
        if (this.controllers.animation?.observer) {
            this.controllers.animation.observer.disconnect();
        }

        // 이벤트 리스너 제거
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('error', this.handleGlobalError);
        window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);

        // 컨트롤러들 정리
        this.controllers = {};
        this.isInitialized = false;

        console.log('🧹 AI Education App이 정리되었습니다.');
    }
}

// ===== 유틸리티 기능들 =====

// 브라우저 호환성 체크
function checkBrowserCompatibility() {
    const features = {
        intersectionObserver: 'IntersectionObserver' in window,
        cssVariables: CSS.supports('color', 'var(--fake-var)'),
        flexbox: CSS.supports('display', 'flex'),
        grid: CSS.supports('display', 'grid'),
        asyncAwait: true, // 이미 사용 중이므로 지원됨
        promises: 'Promise' in window,
        fetch: 'fetch' in window,
        clipboard: 'clipboard' in navigator,
        battery: 'getBattery' in navigator
    };

    const unsupported = Object.entries(features)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

    if (unsupported.length > 0) {
        console.warn('⚠️ 일부 기능이 이 브라우저에서 지원되지 않습니다:', unsupported);
        
        // 크리티컬한 기능이 없는 경우 경고
        const critical = ['cssVariables', 'flexbox', 'promises'];
        const criticalMissing = unsupported.filter(feature => critical.includes(feature));
        
        if (criticalMissing.length > 0) {
            document.body.classList.add('legacy-browser');
            return false;
        }
    }

    return true;
}

// 성능 모니터링
function setupPerformanceMonitoring() {
    // 페이지 로드 성능 측정
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            if (perfData) {
                const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
                const domReady = perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart;
                
                console.log('📊 성능 정보:', {
                    '페이지 로드 시간': `${Math.round(loadTime)}ms`,
                    'DOM 준비 시간': `${Math.round(domReady)}ms`,
                    '전체 로드 시간': `${Math.round(perfData.loadEventEnd - perfData.fetchStart)}ms`
                });

                // 느린 로드 시간 경고
                if (loadTime > 3000) {
                    console.warn('⚠️ 페이지 로드가 느립니다. 성능 최적화를 고려해보세요.');
                }
            }
        }, 0);
    });

    // 메모리 사용량 모니터링 (Chrome만 지원)
    if (performance.memory) {
        setInterval(() => {
            const memInfo = performance.memory;
            const usedMB = Math.round(memInfo.usedJSHeapSize / 1024 / 1024);
            const limitMB = Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024);
            
            // 메모리 사용량이 80% 이상일 때 경고
            if (usedMB / limitMB > 0.8) {
                console.warn(`⚠️ 높은 메모리 사용량: ${usedMB}MB / ${limitMB}MB`);
            }
        }, 30000); // 30초마다 체크
    }
}

// 개발 도구
function setupDevelopmentTools() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // 개발 모드 스타일 추가
        const devStyle = document.createElement('style');
        devStyle.textContent = `
            .dev-info {
                position: fixed;
                bottom: 10px;
                left: 10px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                font-family: monospace;
                font-size: 12px;
                z-index: 9999;
                opacity: 0.7;
                pointer-events: none;
            }
        `;
        document.head.appendChild(devStyle);

        // 개발 정보 표시
        const devInfo = document.createElement('div');
        devInfo.className = 'dev-info';
        devInfo.textContent = 'DEV MODE';
        document.body.appendChild(devInfo);

        // 전역 헬퍼 함수들
        window.debugApp = {
            getControllers: () => window.AIEducationApp?.controllers,
            getStatus: () => window.AIEducationApp?.getStatus(),
            testNotification: (msg, type) => window.AIEducationApp?.showNotification(msg, type),
            scrollTo: (selector) => window.AIEducationApp?.scrollToSection(selector),
            toggleFAQ: (index) => window.AIEducationApp?.toggleFAQ(index)
        };

        console.log('🛠️ 개발 도구가 활성화되었습니다. window.debugApp을 사용해보세요.');
    }
}

// 에러 리포팅 (실제 환경에서는 서버로 전송)
function setupErrorReporting() {
    const errorQueue = [];
    const MAX_ERRORS = 10;

    function reportError(error, context = '') {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        errorQueue.push(errorInfo);
        
        // 큐 크기 제한
        if (errorQueue.length > MAX_ERRORS) {
            errorQueue.shift();
        }

        // 개발 모드에서는 콘솔에 출력
        if (window.location.hostname === 'localhost') {
            console.error('📝 에러 리포트:', errorInfo);
        }

        // 실제 환경에서는 여기서 서버로 전송
        // sendErrorToServer(errorInfo);
    }

    // 전역 에러 핸들러
    window.addEventListener('error', (event) => {
        reportError(event.error, 'Global Error');
    });

    window.addEventListener('unhandledrejection', (event) => {
        reportError(new Error(event.reason), 'Unhandled Promise Rejection');
    });

    // 에러 리포트 API
    window.getErrorReports = () => [...errorQueue];
}

// A/B 테스트 지원
function setupABTesting() {
    // 간단한 A/B 테스트 프레임워크
    const experiments = {
        'button-color': {
            variants: ['primary', 'secondary'],
            weight: [0.5, 0.5]
        },
        'header-animation': {
            variants: ['fade', 'slide'],
            weight: [0.6, 0.4]
        }
    };

    function getVariant(experimentName) {
        const experiment = experiments[experimentName];
        if (!experiment) return null;

        // 사용자 ID 기반으로 일관된 변형 제공 (쿠키나 로컬스토리지 사용)
        const userId = localStorage.getItem('user-id') || Math.random().toString(36);
        localStorage.setItem('user-id', userId);

        // 해시를 사용해 일관된 변형 선택
        const hash = Array.from(userId).reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);

        const normalizedHash = Math.abs(hash) / Math.pow(2, 31);
        
        let cumulative = 0;
        for (let i = 0; i < experiment.variants.length; i++) {
            cumulative += experiment.weight[i];
            if (normalizedHash <= cumulative) {
                return experiment.variants[i];
            }
        }

        return experiment.variants[0]; // 폴백
    }

    // 실험 적용
    const buttonVariant = getVariant('button-color');
    if (buttonVariant === 'secondary') {
        document.body.classList.add('experiment-button-secondary');
    }

    const animationVariant = getVariant('header-animation');
    if (animationVariant === 'slide') {
        document.body.classList.add('experiment-header-slide');
    }

    // 개발 모드에서 실험 정보 출력
    if (window.location.hostname === 'localhost') {
        console.log('🧪 A/B 테스트 변형:', {
            'button-color': buttonVariant,
            'header-animation': animationVariant
        });
    }
}

// 사용자 행동 분석
function setupAnalytics() {
    const analytics = {
        events: [],
        
        track(eventName, properties = {}) {
            const event = {
                name: eventName,
                properties: {
                    ...properties,
                    timestamp: Date.now(),
                    url: window.location.href,
                    userAgent: navigator.userAgent
                }
            };
            
            this.events.push(event);
            
            // 개발 모드에서 이벤트 로깅
            if (window.location.hostname === 'localhost') {
                console.log('📈 Analytics Event:', event);
            }
            
            // 실제 환경에서는 분석 서비스로 전송
            // this.sendToAnalytics(event);
        },
        
        getEvents() {
            return [...this.events];
        }
    };

    // 페이지 뷰 추적
    analytics.track('page_view', {
        page: document.title,
        referrer: document.referrer
    });

    // 클릭 이벤트 추적
    document.addEventListener('click', (e) => {
        const element = e.target.closest('a, button, .cta-btn, .feature-card, .faq-question');
        if (element) {
            analytics.track('click', {
                element_type: element.tagName.toLowerCase(),
                element_class: element.className,
                element_text: element.textContent.trim().substring(0, 50)
            });
        }
    });

    // 스크롤 깊이 추적
    let maxScrollDepth = 0;
    window.addEventListener('scroll', Utils.throttle(() => {
        const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        if (scrollDepth > maxScrollDepth) {
            maxScrollDepth = scrollDepth;
            if (scrollDepth % 25 === 0) { // 25%, 50%, 75%, 100%
                analytics.track('scroll_depth', { depth: scrollDepth });
            }
        }
    }, 1000));

    // 시간 추적
    const startTime = Date.now();
    window.addEventListener('beforeunload', () => {
        const timeSpent = Math.round((Date.now() - startTime) / 1000);
        analytics.track('session_duration', { 
            duration: timeSpent,
            max_scroll_depth: maxScrollDepth
        });
    });

    // 전역 analytics 객체
    window.analytics = analytics;
}

// ===== 애플리케이션 초기화 =====
(function initializeApp() {
    // 브라우저 호환성 체크
    const isCompatible = checkBrowserCompatibility();
    
    if (!isCompatible) {
        // 레거시 브라우저용 폴백
        document.body.innerHTML += `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                background: #F43F5E;
                color: white;
                padding: 10px;
                text-align: center;
                z-index: 10000;
                font-size: 14px;
            ">
                최신 브라우저에서 더 나은 경험을 제공합니다. 브라우저 업데이트를 권장합니다.
            </div>
        `;
    }

    // 개발 도구 설정
    setupDevelopmentTools();
    
    // 성능 모니터링 설정
    setupPerformanceMonitoring();
    
    // 에러 리포팅 설정
    setupErrorReporting();
    
    // A/B 테스트 설정
    setupABTesting();
    
    // 분석 도구 설정
    setupAnalytics();

    // 메인 애플리케이션 초기화
    const app = new AIEducationApp();
    
    // 전역 앱 참조 (디버깅용)
    window.app = app;

    // 페이지 로드 완료 시 추가 설정
    window.addEventListener('load', () => {
        // 로딩 인디케이터 제거
        const loader = document.querySelector('.loader');
        if (loader) {
            loader.remove();
        }

        // 페이지 가시성 표시
        document.body.classList.add('loaded');

        // 성능 정보 로깅
        if (window.analytics) {
            window.analytics.track('page_loaded', {
                load_time: performance.now()
            });
        }
    });

    // 서비스 워커 등록 (PWA 지원)
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('🔧 Service Worker 등록 성공:', registration);
            })
            .catch(error => {
                console.log('⚠️ Service Worker 등록 실패:', error);
            });
    }

    console.log('✅ AI Education Landing Page 초기화 완료!');
})();

// ===== 외부 API =====
// 다른 스크립트에서 사용할 수 있는 공개 API
window.AIEducation = {
    // 페이지 내 네비게이션
    scrollToSection: (selector) => window.app?.scrollToSection(selector),
    
    // 알림 표시
    showMessage: (message, type) => window.app?.showNotification(message, type),
    
    // FAQ 토글
    openFAQ: (index) => window.app?.toggleFAQ(index),
    
    // 상태 정보
    getStatus: () => window.app?.getStatus(),
    
    // 이벤트 추적
    trackEvent: (name, data) => window.analytics?.track(name, data),
    
    // 앱 제어
    destroy: () => window.app?.destroy()
};