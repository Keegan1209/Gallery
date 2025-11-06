'use client'

import { useState, useEffect } from 'react'

// Extend Window interface for GSAP
declare global {
    interface Window {
        gsap: any;
        Flip: any;
    }
}

export default function ComponentTestPage() {
    const [gsapLoaded, setGsapLoaded] = useState(false)

    // Load GSAP dynamically
    useEffect(() => {
        const loadGSAP = async () => {
            if (typeof window !== 'undefined' && !window.gsap) {
                const gsapScript = document.createElement('script')
                gsapScript.src = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js'
                gsapScript.onload = () => {
                    const flipScript = document.createElement('script')
                    flipScript.src = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/Flip.min.js'
                    flipScript.onload = () => {
                        setGsapLoaded(true)
                        console.log('GSAP and Flip loaded successfully')
                    }
                    document.head.appendChild(flipScript)
                }
                document.head.appendChild(gsapScript)
            } else if (window.gsap) {
                setGsapLoaded(true)
            }
        }
        loadGSAP()
    }, [])

    // GSAP Animation Function
    const moveCard = () => {
        console.log('moveCard called')
        console.log('gsapLoaded:', gsapLoaded)
        console.log('window.gsap:', !!window.gsap)
        console.log('window.Flip:', !!window.Flip)

        if (!gsapLoaded || !window.gsap || !window.Flip) {
            console.log('GSAP not ready')
            return
        }

        const slider = document.getElementById('gsap-slider')
        const items = slider?.querySelectorAll('.gsap-item')

        console.log('slider:', slider)
        console.log('items found:', items?.length)

        if (!slider || !items || items.length === 0) {
            console.log('No slider or items found')
            return
        }

        try {
            console.log('Starting animation...')

            // Get current state
            const state = window.Flip.getState('.gsap-item')
            console.log('Flip state captured')

            // Move last item to front
            const lastItem = slider.querySelector('.gsap-item:last-child')
            if (lastItem && slider.firstChild) {
                console.log('Moving last item to front')
                slider.insertBefore(lastItem, slider.firstChild)

                // Update positioning for all items after DOM change
                const allItems = slider.querySelectorAll('.gsap-item')
                allItems.forEach((item, index) => {
                    const element = item as HTMLElement
                    element.style.left = `${index * 40}px`
                    element.style.top = `${-index * 40}px`
                    element.style.zIndex = `${5 - index}`
                })
            }

            // Animate with Flip
            window.Flip.from(state, {
                targets: '.gsap-item',
                duration: 0.6,
                ease: 'sine.inOut',
                absolute: true,
                onComplete: () => {
                    console.log('Animation complete')
                },
                onEnter: (elements: any) => {
                    console.log('onEnter triggered')
                    return window.gsap.from(elements, {
                        yPercent: 20,
                        opacity: 0,
                        duration: 0.6,
                        ease: 'expo.out'
                    })
                },
                onLeave: (elements: any) => {
                    console.log('onLeave triggered')
                    return window.gsap.to(elements, {
                        yPercent: 20,
                        xPercent: -20,
                        transformOrigin: 'bottom left',
                        opacity: 0,
                        duration: 0.6,
                        ease: 'expo.out'
                    })
                }
            })
        } catch (error) {
            console.error('Animation error:', error)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Arial, sans-serif'
        }}>
            {/* Simple GSAP Stacked Cards */}
            <div
                id="gsap-slider"
                style={{
                    position: 'relative',
                    width: '300px',
                    height: '200px',
                    cursor: 'pointer'
                }}
                onClick={moveCard}
            >
                {/* Stacked Images */}
                {[
                    'https://i.pinimg.com/1200x/6f/9f/b1/6f9fb19956a4c1af06f1c9eccc7f91ca.jpg',
                    'https://i.pinimg.com/736x/43/64/6f/43646f0cc47ae98e4d56002f39a68f80.jpg',
                    'https://i.pinimg.com/736x/a6/31/d6/a631d623d718fdd26d9b2db8da841ff0.jpg',
                    'https://i.pinimg.com/736x/1c/68/6a/1c686ab70cc4ebc6165f5dc189d394d5.jpg',
                    'https://i.pinimg.com/1200x/60cc/87/60cc8744fb901d18eadd51dffba37043.jpg'
                ].map((src, index) => (
                    <img
                        key={index}
                        className="gsap-item"
                        src={src}
                        alt={`Card ${index + 1}`}
                        style={{
                            position: 'absolute',
                            width: '300px',
                            aspectRatio: '2/3',
                            objectFit: 'cover',
                            objectPosition: 'top',
                            border: '1px solid rgba(0,0,0,0.2)',
                            borderRadius: '8px',
                            left: `${index * 40}px`,
                            top: `${-index * 40}px`,
                            zIndex: 5 - index
                        }}
                    />
                ))}
            </div>

            {/* Debug info */}
            <div style={{
                position: 'fixed',
                top: '10px',
                left: '10px',
                fontSize: '10px',
                color: '#666',
                backgroundColor: 'rgba(255,255,255,0.8)',
                padding: '5px'
            }}>
                GSAP: {gsapLoaded ? '✅' : '⏳'} |
                Flip: {typeof window !== 'undefined' && window.Flip ? '✅' : '❌'} |
                Click to cycle
            </div>
        </div>
    )
}