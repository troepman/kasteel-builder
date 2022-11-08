
function compute(options, numberOfYears=50) {
    const {target, beerContribution, pandContribution, inflationRate, interestRate, yearlyBeerConsumption, numberOfMembers} = options;

    const yearStates = []
    let currentState = {
        year: 0,
        savings: 0,
        incomeBeer: 0,
        incomePand: 0,
        incomeInterest: 0,
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
            target: currentState.target * (1 + inflationRate),
            beerContribution: currentState.beerContribution * (1 + inflationRate),
            pandContribution: currentState.pandContribution * (1 + inflationRate)
        }
    }
    return yearStates;
}

let myChart;

function updateChart(yearStates) {
    const data = {
        labels: yearStates.map(k => k.year),
        datasets: [{
            label:"Savings",
            data: yearStates.map(k => k.savings),
            backgroundColor: '#1d4e9a',
            borderColor: '#1d4e9a'
        }, {
            label:"Target",
            data: yearStates.map(k => k.target),
            backgroundColor: '#888888',
            borderColor: '#888888'
        }]
    }
    
    if (myChart) {
        myChart.data.datasets[0].data = data.datasets[0].data;
        myChart.data.datasets[1].data = data.datasets[1].data;
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

function onUpdate() {
    console.log('updating')

    const beerContribution = document.getElementById('beer_contribution').value;
    const pandContribution = document.getElementById('pand_contribution').value

    const result = compute({
        target:250000, beerContribution, pandContribution, inflationRate:0.03, interestRate:0.04, yearlyBeerConsumption:7000*3.33, numberOfMembers:350
    })

    updateChart(result);
}

let updateTimeout;

function onChange() {
    if (updateTimeout) {
        clearTimeout(updateTimeout)
    }
    updateTimeout = setTimeout(onUpdate, 1000)
    console.log('Setting new timeout')
}

document.addEventListener('DOMContentLoaded', () => {
    onUpdate();

    for (const inputEl of document.getElementById('input_container').getElementsByTagName('input')) {
        console.log(inputEl)
        inputEl.addEventListener('change', onChange);
    }
})