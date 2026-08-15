/* =====================================================
   MATCHCONNECT JOBS
===================================================== */


/* =====================================================
   SAMPLE JOBS
===================================================== */

const jobs = [

    {
        id: 1,
        title: "Frontend Developer",
        company: "Tech Solutions",
        location: "Tripoli",
        category: "technology",
        type: "full-time",
        salary: 1200,
        currency: "$",
        remote: true,
        posted: 10,
        description:
            "We are looking for a frontend developer to build and maintain modern web applications using HTML, CSS and JavaScript."
    },

    {
        id: 2,
        title: "Social Media Manager",
        company: "Digital Media Agency",
        location: "Remote",
        category: "business",
        type: "full-time",
        salary: 800,
        currency: "$",
        remote: true,
        posted: 9,
        description:
            "Manage social media pages, create content and help businesses grow their online presence."
    },

    {
        id: 3,
        title: "Sales Representative",
        company: "Global Trading",
        location: "Benghazi",
        category: "sales",
        type: "full-time",
        salary: 700,
        currency: "$",
        remote: false,
        posted: 8,
        description:
            "Develop customer relationships, identify sales opportunities and meet monthly sales targets."
    },

    {
        id: 4,
        title: "Graphic Designer",
        company: "Creative Studio",
        location: "Tripoli",
        category: "design",
        type: "contract",
        salary: 600,
        currency: "$",
        remote: true,
        posted: 7,
        description:
            "Create professional graphics for social media, advertising campaigns and business branding."
    },

    {
        id: 5,
        title: "English Teacher",
        company: "Learning Center",
        location: "Misrata",
        category: "education",
        type: "part-time",
        salary: 500,
        currency: "$",
        remote: false,
        posted: 6,
        description:
            "Teach English language classes and help students improve their communication skills."
    },

    {
        id: 6,
        title: "Customer Support Agent",
        company: "Connect Services",
        location: "Remote",
        category: "business",
        type: "part-time",
        salary: 450,
        currency: "$",
        remote: true,
        posted: 5,
        description:
            "Assist customers through chat, email and telephone while providing excellent customer service."
    },

    {
        id: 7,
        title: "Nurse",
        company: "Private Medical Center",
        location: "Tripoli",
        category: "health",
        type: "full-time",
        salary: 900,
        currency: "$",
        remote: false,
        posted: 4,
        description:
            "Provide professional nursing care and support to patients in a clinical environment."
    },

    {
        id: 8,
        title: "Web Designer",
        company: "Web Creators",
        location: "Remote",
        category: "technology",
        type: "contract",
        salary: 1000,
        currency: "$",
        remote: true,
        posted: 3,
        description:
            "Design responsive websites and user interfaces for businesses and online platforms."
    }

];


/* =====================================================
   STATE
===================================================== */

let displayedJobs =
    [...jobs];

let selectedCategory =
    "all";

let selectedType =
    "all";

let currentSort =
    "new";


/* =====================================================
   DOM
===================================================== */

const jobsList =
    document.getElementById(
        "jobsList"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );

const jobSearch =
    document.getElementById(
        "jobSearch"
    );

const clearSearch =
    document.getElementById(
        "clearSearch"
    );

const jobModal =
    document.getElementById(
        "jobModal"
    );

const jobDetails =
    document.getElementById(
        "jobDetails"
    );

const sortMenu =
    document.getElementById(
        "sortMenu"
    );

const toast =
    document.getElementById(
        "toast"
    );


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(
    value = ""
) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =====================================================
   FORMAT SALARY
===================================================== */

function formatSalary(job) {

    return (
        job.currency +
        Number(job.salary)
            .toLocaleString()
    );

}


/* =====================================================
   JOB CARD
===================================================== */

function renderJobs() {

    jobsList.innerHTML = "";


    if (!displayedJobs.length) {

        jobsList.classList.add(
            "hidden"
        );

        emptyState.classList.remove(
            "hidden"
        );

        return;

    }


    jobsList.classList.remove(
        "hidden"
    );

    emptyState.classList.add(
        "hidden"
    );


    displayedJobs.forEach(
        job => {

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "job-card";


            card.innerHTML = `

                <div class="job-card-top">

                    <div class="company-logo">

                        <i class="fas fa-building"></i>

                    </div>


                    <div class="job-main">

                        <div class="job-title">

                            ${escapeHTML(
                                job.title
                            )}

                        </div>


                        <div class="company-name">

                            ${escapeHTML(
                                job.company
                            )}

                        </div>


                        <div class="job-location">

                            <i class="fas fa-location-dot"></i>

                            ${escapeHTML(
                                job.location
                            )}

                        </div>

                    </div>

                </div>


                <div class="job-meta">

                    <span class="job-tag">

                        ${escapeHTML(
                            capitalize(
                                job.type
                            )
                        )}

                    </span>


                    ${
                        job.remote
                        ? `
                            <span class="job-tag">
                                Remote
                            </span>
                        `
                        : ""
                    }


                    <span class="job-tag job-salary">

                        ${formatSalary(job)}

                    </span>

                </div>


                <div class="job-bottom">

                    <span class="posted-time">

                        Posted ${job.posted} days ago

                    </span>


                    <span class="apply-text">

                        View Job
                        <i class="fas fa-chevron-right"></i>

                    </span>

                </div>

            `;


            card.addEventListener(
                "click",
                () => {

                    openJob(
                        job.id
                    );

                }
            );


            jobsList.appendChild(
                card
            );

        }
    );

}


/* =====================================================
   OPEN JOB
===================================================== */

function openJob(jobId) {

    const job =
        jobs.find(
            item =>
                item.id ===
                jobId
        );


    if (!job) {
        return;
    }


    jobDetails.innerHTML = `

        <div class="details-header">

            <h2>
                ${escapeHTML(
                    job.title
                )}
            </h2>

            <div class="details-company">

                ${escapeHTML(
                    job.company
                )}

            </div>

        </div>


        <div class="details-row">

            <i class="fas fa-location-dot"></i>

            <span>
                ${escapeHTML(
                    job.location
                )}
            </span>

        </div>


        <div class="details-row">

            <i class="fas fa-briefcase"></i>

            <span>
                ${capitalize(
                    job.type
                )}
            </span>

        </div>


        <div class="details-row">

            <i class="fas fa-money-bill"></i>

            <span>
                ${formatSalary(job)}
                / month
            </span>

        </div>


        <div class="details-row">

            <i class="fas fa-laptop"></i>

            <span>
                ${
                    job.remote
                    ? "Remote Available"
                    : "On-site"
                }
            </span>

        </div>


        <div class="details-description">

            ${escapeHTML(
                job.description
            )}

        </div>


        <button
            class="apply-button"
            onclick="applyForJob(${job.id})"
        >

            <i class="fas fa-paper-plane"></i>

            Apply for Job

        </button>

    `;


    jobModal.classList.remove(
        "hidden"
    );


    document.body.style.overflow =
        "hidden";

}


/* =====================================================
   CLOSE MODAL
===================================================== */

function closeJobModal() {

    jobModal.classList.add(
        "hidden"
    );

    document.body.style.overflow =
        "";

}


/* =====================================================
   APPLY
===================================================== */

function applyForJob(jobId) {

    const job =
        jobs.find(
            item =>
                item.id ===
                jobId
        );


    if (!job) {
        return;
    }


    let applications =
        JSON.parse(
            localStorage.getItem(
                "matchconnectApplications"
            )
        ) || [];


    const alreadyApplied =
        applications.some(
            item =>
                item.jobId ===
                jobId
        );


    if (alreadyApplied) {

        showToast(
            "You already applied for this job"
        );

        return;

    }


    applications.push({

        id:
            Date.now().toString(),

        jobId:
            job.id,

        title:
            job.title,

        company:
            job.company,

        appliedAt:
            new Date().toISOString(),

        status:
            "pending"

    });


    localStorage.setItem(
        "matchconnectApplications",
        JSON.stringify(
            applications
        )
    );


    showToast(
        "Application submitted"
    );


    closeJobModal();

}


/* =====================================================
   SEARCH
===================================================== */

jobSearch.addEventListener(
    "input",
    filterJobs
);


function filterJobs() {

    const search =
        jobSearch.value
            .trim()
            .toLowerCase();


    clearSearch.style.display =
        search
        ? "block"
        : "none";


    displayedJobs =
        jobs.filter(job => {

            const matchesSearch =
                !search ||

                job.title
                    .toLowerCase()
                    .includes(search) ||

                job.company
                    .toLowerCase()
                    .includes(search) ||

                job.location
                    .toLowerCase()
                    .includes(search);


            const matchesCategory =
                selectedCategory ===
                "all" ||

                job.category ===
                selectedCategory;


            const matchesType =
                selectedType ===
                "all" ||

                job.type ===
                selectedType ||

                (
                    selectedType ===
                    "remote" &&
                    job.remote
                );


            return (
                matchesSearch &&
                matchesCategory &&
                matchesType
            );

        });


    sortCurrentJobs();

    renderJobs();

}


/* =====================================================
   CLEAR SEARCH
===================================================== */

clearSearch.addEventListener(
    "click",
    () => {

        jobSearch.value = "";

        filterJobs();

        jobSearch.focus();

    }
);


/* =====================================================
   CATEGORY
===================================================== */

document
    .querySelectorAll(
        ".category"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".category"
                    )
                    .forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                button.classList.add(
                    "active"
                );


                selectedCategory =
                    button.dataset.category;


                filterJobs();

            }
        );

    });


/* =====================================================
   TYPE FILTER
===================================================== */

document
    .querySelectorAll(
        ".filter-btn"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".filter-btn"
                    )
                    .forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                button.classList.add(
                    "active"
                );


                selectedType =
                    button.dataset.type;


                filterJobs();

            }
        );

    });


/* =====================================================
   SORT
===================================================== */

function toggleSort() {

    sortMenu.classList.toggle(
        "hidden"
    );

}


function sortJobs(type) {

    currentSort =
        type;

    sortCurrentJobs();

    renderJobs();

    sortMenu.classList.add(
        "hidden"
    );

}


function sortCurrentJobs() {

    if (
        currentSort ===
        "salary-high"
    ) {

        displayedJobs.sort(
            (a, b) =>
                b.salary -
                a.salary
        );

    }

    else if (
        currentSort ===
        "salary-low"
    ) {

        displayedJobs.sort(
            (a, b) =>
                a.salary -
                b.salary
        );

    }

    else {

        displayedJobs.sort(
            (a, b) =>
                a.posted -
                b.posted
        );

    }

}


/* =====================================================
   RESET
===================================================== */

function resetJobs() {

    jobSearch.value = "";

    selectedCategory =
        "all";

    selectedType =
        "all";

    currentSort =
        "new";


    document
        .querySelectorAll(
            ".category"
        )
        .forEach(
            button =>
                button.classList.remove(
                    "active"
                )
        );


    document
        .querySelector(
            '.category[data-category="all"]'
        )
        .classList.add(
            "active"
        );


    document
        .querySelectorAll(
            ".filter-btn"
        )
        .forEach(
            button =>
                button.classList.remove(
                    "active"
                )
        );


    document
        .querySelector(
            '.filter-btn[data-type="all"]'
        )
        .classList.add(
            "active"
        );


    displayedJobs =
        [...jobs];


    sortCurrentJobs();

    renderJobs();

}


/* =====================================================
   QUICK ACTIONS
===================================================== */

function postJob() {

    window.location.href =
        "post-job.html";

}


function myApplications() {

    window.location.href =
        "applications.html";

}


function savedJobs() {

    window.location.href =
        "saved-jobs.html";

}


function myJobs() {

    window.location.href =
        "my-jobs.html";

}


/* =====================================================
   CAPITALIZE
===================================================== */

function capitalize(value) {

    if (!value) {
        return "";
    }

    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );

}


/* =====================================================
   TOAST
===================================================== */

let toastTimer;


function showToast(message) {

    toast.textContent =
        message;

    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );

}


/* =====================================================
   MODAL OUTSIDE CLICK
===================================================== */

jobModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            jobModal
        ) {

            closeJobModal();

        }

    }
);


/* =====================================================
   ESCAPE
===================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            closeJobModal();

            sortMenu.classList.add(
                "hidden"
            );

        }

    }
);


/* =====================================================
   INITIALIZE
===================================================== */

sortCurrentJobs();

renderJobs();
