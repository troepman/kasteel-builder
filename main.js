
function compute(options, numberOfYears=40) {
    const {target, beerContribution, pandContribution, inflationRate, interestRate, yearlyBeerConsumption, numberOfMembers} = options;
    console.log(options)

    const yearStates = []
    let currentState = {
        year: 0,
        savings: 0,
        incomeBeer: 0,
        incomePand: 0,
        incomeInterest: 0,
        savingsBeer: 0,
        savingsContribution: 0,
        savingsInterest: 0,
        target,
        beerContribution,
        pandContribution,
    }

    while (currentState.year <= numberOfYears) {
        // Save the previous year
        yearStates.push(currentState);

        // Compute the income
        incomeBeer = yearlyBeerConsumption * currentState.beerContribution;
        incomeContribution = numberOfMembers * currentState.pandContribution;
        incomeInterest = interestRate * currentState.savings;

        // Compute the new state at the end of the year
        currentState = {
            year: currentState.year+1,
            savings: currentState.savings + incomeBeer + incomeContribution + incomeInterest,
            incomeBeer,
            incomeContribution,
            incomeInterest,
            savingsBeer: currentState.savingsBeer + incomeBeer,
            savingsContribution: currentState.savingsContribution + incomeContribution,
            savingsInterest: currentState.savingsInterest + incomeInterest,
            target: currentState.target * (1 + inflationRate),
            beerContribution: currentState.beerContribution * (1 + inflationRate),
            pandContribution: currentState.pandContribution * (1 + inflationRate)
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
            order:3,
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
            backgroundColor: colors.beer  + colors.background,
            borderColor: colors.beer,
            fill: true,
            order:2
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
}

function onUpdate() {
    console.log('updating')

    const beerContribution = Number(document.getElementById('beer_contribution').value);
    const pandContribution = Number(document.getElementById('pand_contribution').value);
    const inflationRate = Number(document.getElementById('inflation_rate').value);
    const interestRate = Number(document.getElementById('interest_rate').value);
    const buyTogether = document.getElementById("buy_together").checked;

    console.log(inflationRate)

    let target = 250000;
    if (buyTogether) {
        target = target * (4/5);
    }

    const result = compute({
        target, beerContribution, pandContribution, inflationRate, interestRate, yearlyBeerConsumption:7000*3.33, numberOfMembers:350
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
    const formatters = {
        euro: (val) => (new Intl.NumberFormat('nl-NL', {style:'currency', currency:'EUR'}).format(val)),
        percentage : (val) => (new Intl.NumberFormat('nl-NL', {style:'percent', minimumFractionDigits:1}).format(val))
    }
    const spanEl = document.getElementById(ev.target.id + "_value");
    if (!spanEl) return;
    if (spanEl.dataset.type in formatters){
        spanEl.innerText = formatters[spanEl.dataset.type](ev.target.value);
    } else {
        spanEl.innerText = ev.target.value;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const defaultValues = {
        "beer_contribution": 0.20,
        "pand_contribution": 10,
        "inflation_rate": 0.03,
        "interest_rate": 0.04
    }

    for (const inputEl of document.getElementById('input_container').getElementsByTagName('input')) {
        inputEl.addEventListener('change', onChange);
        inputEl.addEventListener('input', showVal);
        if (inputEl.id in defaultValues){
            inputEl.value = defaultValues[inputEl.id]
        }
        showVal({target: inputEl})
    }
    onUpdate();
})