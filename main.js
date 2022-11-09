const formatters = {
    euro: (val) => (new Intl.NumberFormat('nl-NL', {style:'currency', currency:'EUR'}).format(val)),
    percentage: (val) => (new Intl.NumberFormat('nl-NL', {style:'percent', minimumFractionDigits:1}).format(val)),
    hectoLiter: (val) => (new Intl.NumberFormat('nl-NL', {style:'decimal', minimumFractionDigits:0}).format(val) + " hL")
}

function compute(options, numberOfYears=40) {
    const {target, beerContribution, pandContribution, inflationRate, interestRate, yearlyBeerConsumption, numberOfMembers, otherContribution} = options;
    console.log(options)

    const yearStates = []
    let currentState = {
        year: 0,
        savings: 0,
        incomeBeer: 0,
        incomePand: 0,
        incomeInterest: 0,
        incomeOther: 0,
        savingsBeer: 0,
        savingsContribution: 0,
        savingsOther:0,
        savingsInterest: 0,
        target,
        beerContribution,
        pandContribution,
        otherContribution,
    }

    while (currentState.year <= numberOfYears) {
        // Save the previous year
        yearStates.push(currentState);

        // Compute the income
        incomeBeer = yearlyBeerConsumption * currentState.beerContribution;
        incomeContribution = numberOfMembers * currentState.pandContribution;
        incomeOther = otherContribution;
        
        incomeInterest = interestRate * currentState.savings;
        

        // Compute the new state at the end of the year
        currentState = {
            year: currentState.year+1,
            savings: currentState.savings + incomeBeer + incomeContribution + incomeInterest + incomeOther,
            incomeBeer,
            incomeContribution,
            incomeInterest,
            savingsBeer: currentState.savingsBeer + incomeBeer,
            savingsContribution: currentState.savingsContribution + incomeContribution,
            savingsInterest: currentState.savingsInterest + incomeInterest,
            savingsOther: currentState.savingsOther + incomeOther,
            target: currentState.target * (1 + inflationRate),
            beerContribution: currentState.beerContribution * (1 + inflationRate),
            pandContribution: currentState.pandContribution * (1 + inflationRate),
            otherContribution: currentState.otherContribution * (1 + inflationRate)
        }
    }
    return yearStates;
}

function extractTargetReachedYear(yearStates) {
    const targetReached = yearStates.reduceRight((current, state) => (state.target < state.savings ? state : current))

    return targetReached
}

let myChart;

function updateChart(yearStates) {
    const colors = {
        interest: '#1d4e9a',
        contribution: '#873e23',
        beer: '#ECD578',
        misc: '#b2c756',
        target: '#888888',
        background: '8f'
    }
    const data = {
        labels: yearStates.map(k => k.year),
        datasets: [{
            label:"Interest",
            data: yearStates.map(k => k.savings),
            backgroundColor: colors.interest + colors.background,
            borderColor: colors.interest,
            fill: true,
            order:4,
        },{
            label:'Pand contribution',
            data: yearStates.map(k => k.savingsContribution),
            backgroundColor: colors.contribution  + colors.background,
            borderColor: colors.contribution,
            fill: true,
            order:1
        }, {
            label:'Beer contribution',
            data: yearStates.map(k => k.savingsContribution + k.savingsBeer),
            backgroundColor: colors.beer + colors.background,
            borderColor: colors.beer,
            fill: true,
            order:2
        }, {
            label: 'Miscellaneous contribution',
            data: yearStates.map(k => k.savingsContribution + k.savingsBeer + k.savingsOther),
            backgroundColor: colors.misc + colors.background,
            borderColor: colors.misc,
            fill: true,
            order: 3
        }, {
            label:"Target",
            data: yearStates.map(k => k.target),
            backgroundColor: colors.target,
            borderColor: colors.target,
            order: 0,
        }]
    }
    
    if (myChart) {
        data.datasets.forEach((d, i) => myChart.data.datasets[i].data = d.data)
        myChart.update();
    } else {
        const ctx = document.getElementById('result_chart').getContext('2d');
        const config = {
            type: 'line',
            data,
            options: {
                responsive: true,
                scales: {
                    yAxis:{
                        axis:'y',
                        min: 0, 
                        max: 1000000
                    }
                }
            }
        }
        myChart = new Chart(ctx, config);
    }
}

function updateSummary(yearStates) {
    const stats = extractTargetReachedYear(yearStates);

    document.getElementById('stat_year').innerText = stats.year;
    document.getElementById('stat_savings').innerText = formatters.euro(stats.savings);
}

function onUpdate() {
    console.log('updating')

    const beerContribution = Number(document.getElementById('beer_contribution').value);
    const pandContribution = Number(document.getElementById('pand_contribution').value);
    const inflationRate = Number(document.getElementById('inflation_rate').value);
    const interestRate = Number(document.getElementById('interest_rate').value);
    const buyTogether = document.getElementById("buy_together").checked;
    const otherContribution = Number(document.getElementById('other_contribution').value);
    const yearlyBeerConsumption = Number(document.getElementById('beer_quantity').value)

    let target = 250000;
    if (buyTogether) {
        target = target * (4/5);
    }

    const result = compute({
        target, beerContribution, pandContribution, inflationRate, interestRate, yearlyBeerConsumption:yearlyBeerConsumption*100*3.33, numberOfMembers:350, otherContribution
    })

    updateChart(result);
    updateSummary(result);
}

let updateTimeout;


function onChange() {
    if (updateTimeout) {
        clearTimeout(updateTimeout)
    }
    updateTimeout = setTimeout(onUpdate, 1000)
}

function showVal(ev) {
    
    const spanEl = document.getElementById(ev.target.id + "_value");
    if (!spanEl) return;
    if (spanEl.dataset.type in formatters){
        spanEl.innerText = formatters[spanEl.dataset.type](ev.target.value);
    } else {
        spanEl.innerText = ev.target.value;
    }
}

function recurseToggles(container, {targets, toggles}) {
    if ('toggleTarget' in container.dataset){
        targets[container.dataset['toggleTarget']] = container;
        return;
    }
    if ('toggleFor' in container.dataset){
        toggles.push(container);
        return;
    }
    for (const child of container.children) {
        recurseToggles(child, {targets, toggles})
    }
}
function initializeToggles(container){
    const targets = {}
    const toggles = []
    
    recurseToggles(container, {targets, toggles});

    console.log(targets)
    console.log(toggles)

    function hideAll(){
        for (const key in targets){
            targets[key].style.display = 'none';
        }
    }
    function toggleSpecific(name) {
        if (targets[name].style.display === 'none') {
            hideAll();
            targets[name].style.display = '';
        } else {
            hideAll();
        }
    }

    for (const toggle of toggles) {
        toggle.addEventListener('click', () => toggleSpecific(toggle.dataset['toggleFor']));
    }

    hideAll();
}

document.addEventListener('DOMContentLoaded', () => {
    const defaultValues = {
        "beer_contribution": 0.20,
        "pand_contribution": 10,
        "inflation_rate": 0.03,
        "interest_rate": 0.04,
        "other_contribution": 1000,
        "beer_quantity": 70
    }
    const inputContainer = document.getElementById('input_container')
    for (const inputEl of inputContainer.getElementsByTagName('input')) {
        inputEl.addEventListener('change', onChange);
        inputEl.addEventListener('input', showVal);
        if (inputEl.id in defaultValues){
            inputEl.value = defaultValues[inputEl.id]
        }
        showVal({target: inputEl})
    }
    onUpdate();

    // Set up toggles
    initializeToggles(inputContainer)
})