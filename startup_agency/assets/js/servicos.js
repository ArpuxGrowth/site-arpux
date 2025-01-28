
$(function () {

    "use strict";
    
    $(function () {

        var equalWidth = $(".brand-ds .item").outerWidth();

        $(".brand-ds .item").css({
            "height": equalWidth
        });

    }); 

    var testim = new Swiper(".testimonials-ds .testim-swiper", {
        slidesPerView: 1,
        spaceBetween: 30,
        speed: 1500,
        autoplay: {
            delay: 5000,
        },
        loop: true,
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
    });

    var workswip = new Swiper(".works-ds .work-swiper", {
        slidesPerView: "auto",
        spaceBetween: 30,
        speed: 1500,
        autoplay: {
            delay: 5000,
        },
        loop: true,
        pagination: {
            el: ".works-ds .swiper-pagination",
            clickable: true,
        },

        breakpoints: {
            0: {
                slidesPerView: 1,
            },
            640: {
                slidesPerView: 1,
            },
            768: {
                slidesPerView: 1,
            },
            1024: {
                slidesPerView: "auto",
            },
        },
    });

    $('#monthly-input').on('change', function() {
        $(".monthly_price").show();
        $(".monthly_price").siblings(".yearly_price").hide();
    });
    $('#yearly-input').on('change', function() {
        $(".yearly_price").show();
        $(".yearly_price").siblings(".monthly_price").hide();
    });


    $('.accordion .accordion-item').on('click', function() {
        $(this).addClass("active").siblings().removeClass("active");
    });


});