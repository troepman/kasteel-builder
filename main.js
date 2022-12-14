const formatters = {
    euro: (val) => (new Intl.NumberFormat('nl-NL', {style:'currency', currency:'EUR'}).format(val)),
    largeEuro: (val) => ("€ " + new Intl.NumberFormat('nl-NL', {style: 'decimal', minimumFractionDigits:0, maximumFractionDigits:0}).format(val/1000)+"k"),
    percentage: (val) => (new Intl.NumberFormat('nl-NL', {style:'percent', minimumFractionDigits:1}).format(val)),
    hectoLiter: (val) => (new Intl.NumberFormat('nl-NL', {style:'decimal', minimumFractionDigits:0}).format(val) + " hL")
}
const defaultValues = {
    "beer_contribution": 0.20,
    "pand_contribution": 10,
}
const advancedDefaultValues = {
    "inflation_rate": 0.03,
    "interest_rate": 0.04,
    "other_contribution": 1000,
    "beer_quantity": 70,
    "target_amount": 1000000,
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
        incomeOther = currentState.otherContribution;
        
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

const markDataPointsPlugin = {
    getLinePosition: function (chart, pointIndex, dataSetIndex) {
        const meta = chart.getDatasetMeta(dataSetIndex);
        const data = meta.data;
        return [data[pointIndex].x, data[pointIndex].y];
    },
    renderLines: function (chartInstance, options) {
        const {pointIndex, dataSetIndex} = options;
        
        const [pointX, pointY] = this.getLinePosition(chartInstance, pointIndex, dataSetIndex);
        const dataset = chartInstance.config.data.datasets[dataSetIndex]
        const xTick = chartInstance.config.data.labels[pointIndex];
        const yTick = dataset.data[pointIndex];

        const yScale = Object.values(chartInstance.scales).find(scale => scale.axis === 'y');
        const xScale = Object.values(chartInstance.scales).find(scale => scale.axis === 'x');

        const context = chartInstance.ctx;
  
        // render vertical line
        context.beginPath();
        context.strokeStyle = dataset.borderColor;
        context.lineWidth = dataset.borderWidth ?? 2;
        context.moveTo(xScale.left, pointY);
        context.lineTo(pointX, pointY);
        context.lineTo(pointX, yScale.bottom);
        context.stroke();
  
        // write labels
        context.fillStyle = dataset.borderColor;
        context.textAlign = 'center';
        // x tick
        context.fillText(formatters.largeEuro(yTick), xScale.left + (pointX- xScale.left) / 2, pointY-8);
    },
    parseOptions: function(options) {
        const defaultOptions = {
            dataSetIndex: 0,
            xTick: false,
            yTick: false
        }
        if (typeof(options) === 'number'){
            return {
                pointIndex: options,
                ...defaultOptions
            }
        }
        return {
            ...defaultOptions,
            ...options
        }
    },
    afterDatasetsDraw: function (chart, easing) {
        const lineAtIndex = chart.config.options.lineAtIndex;
        if (lineAtIndex) {
            lineAtIndex.forEach(pointIndex => 
                {
                    const options = this.parseOptions(pointIndex);
                    this.renderLines(chart, options);
                }
            );
        }
    }
};
let myChart1;
let myChart2;
const colors = {
    interest: '#1d4e9a',
    contribution: '#873e23',
    beer: '#ECD578',
    misc: '#b2c756',
    target: '#888888',
    background: '8f'
}
const labels = ["Interest", "Contribution", "Beer", "Miscellaneous", "Target" ]

function updateChart1(yearStates) {
    const finalYear = extractTargetReachedYear(yearStates)
    const data = {
        labels: yearStates.map(k => k.year),
        datasets: [{
            label: labels[0],
            data: yearStates.map(k => k.savings),
            backgroundColor: colors.interest + colors.background,
            borderColor: colors.interest,
            fill: true,
            order:4,
        },{
            label:labels[1],
            data: yearStates.map(k => k.savingsContribution),
            backgroundColor: colors.contribution  + colors.background,
            borderColor: colors.contribution,
            fill: true,
            order:1
        }, {
            label:labels[2],
            data: yearStates.map(k => k.savingsContribution + k.savingsBeer),
            backgroundColor: colors.beer + colors.background,
            borderColor: colors.beer,
            fill: true,
            order:2
        }, {
            label:labels[3],
            data: yearStates.map(k => k.savingsContribution + k.savingsBeer + k.savingsOther),
            backgroundColor: colors.misc + colors.background,
            borderColor: colors.misc,
            fill: true,
            order: 3
        }, {
            label:labels[4],
            data: yearStates.map(k => k.target),
            backgroundColor: colors.target,
            borderColor: colors.target,
            order: 0,
        }]
    }
    
    if (myChart1) {
        data.datasets.forEach((d, i) => myChart1.data.datasets[i].data = d.data)
        myChart1.options.lineAtIndex = finalYear ? [finalYear.year] : undefined;
        myChart1.update();
    } else {
        const ctx = document.getElementById('result_chart').getContext('2d');
        const config = {
            type: 'line',
            data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    yAxis:{
                        axis:'y',
                        min: 0, 
                        max: 1000000,
                        ticks: {
                            callback: formatters.largeEuro
                        },
                        title: {display: true, text: "Savings"}
                    }, 
                    xAxis: {
                        title: {display: true, text: "Years"}
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (item) => formatters.euro(item.raw)
                        }
                    }

                },
                lineAtIndex: finalYear ? [finalYear.year] : undefined
            },
            plugins: [markDataPointsPlugin],
            
        }
        myChart1 = new Chart(ctx, config);
    }
}

function updateChart2(yearStates) {
    const lastYear = extractTargetReachedYear(yearStates);

    const data = {
        labels: [""],
        datasets: [{
            barThickness: 10,
            borderWidth: 2,
            label: labels[1],
            data: [lastYear.savingsContribution],
            backgroundColor: colors.contribution + colors.background,
            borderColor: colors.contribution,
        },
        {
            barThickness: 10,
            borderWidth: 2, 
            label: labels[2], 
            data:[lastYear.savingsBeer],
            backgroundColor: colors.beer + colors.background,
            borderColor: colors.beer,
        },
        {
            barThickness: 10, 
            borderWidth: 2, 
            label: labels[3], 
            data:[lastYear.savingsOther],
            backgroundColor: colors.misc + colors.background,
            borderColor: colors.misc,
        },
        {
            barThickness: 10, 
            borderWidth: 2, 
            label: labels[0], 
            data:[lastYear.savingsInterest],
            backgroundColor: colors.interest + colors.background,
            borderColor: colors.interest,
        }]
    }
    if (myChart2) {
        data.datasets.forEach((d, i) => myChart2.data.datasets[i].data = d.data)
        myChart2.update();
    } else {
        const ctx = document.getElementById('result_chart2').getContext('2d');
        const config = {
            type: 'bar',
            data,
            options: {
                aspectRatio: 6,
                maintainAspectRatio: false,
                responsive: true,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: (item) => formatters.euro(item.raw)
                        }
                    }
                },
                scales: {
                    yAxis:{
                        axis:'y',
                        stacked: true,
                    },
                    xAxis: {
                        axis:'x',
                        stacked: true,
                        ticks:{
                            callback: formatters.largeEuro
                        },
                        title: {display: true, text:"Savings"}
                    }
                }
            }
        }
        myChart2 = new Chart(ctx, config);
    }
}

function updateSummary(yearStates) {
    const stats = extractTargetReachedYear(yearStates);
    if (stats.savings < stats.target){
        document.getElementById('stat_year').innerText = `more than ${stats.year}`;
    } else {
        document.getElementById('stat_year').innerText = stats.year;
    }

    
    document.getElementById('stat_savings').innerText = formatters.euro(stats.savings);
}

function onUpdate() {
    console.log('updating')

    const beerContribution = Number(document.getElementById('beer_contribution').value);
    const pandContribution = Number(document.getElementById('pand_contribution').value);
    const inflationRate = Number(document.getElementById('inflation_rate').value);
    const interestRate = Number(document.getElementById('interest_rate').value);
    const target = Number(document.getElementById('target_amount').value)*0.25;
    console.log(document.getElementById('target_amount').value)
    const otherContribution = Number(document.getElementById('other_contribution').value);
    const yearlyBeerConsumption = Number(document.getElementById('beer_quantity').value)

    const result = compute({
        target, 
        beerContribution, 
        pandContribution, 
        inflationRate, 
        interestRate, 
        yearlyBeerConsumption: yearlyBeerConsumption * 100 * 3.33, 
        numberOfMembers: 350, 
        otherContribution
    })

    updateChart1(result);
    updateChart2(result);
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
function initializeInformationToggles(container){
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

function initializeAdvancedToggles() {
    const advancedInputs = [
        document.getElementById('inflation_rate'),
        document.getElementById('interest_rate'),
        document.getElementById('target_amount'),
        document.getElementById('other_contribution'),
        document.getElementById('beer_quantity')
    ]
    function onChange(ev) {
        const disabled = !ev.target.checked;
        console.log('Setting', disabled)
        for (const advancedInput of advancedInputs){
            advancedInput.disabled = disabled;
        }

        if (disabled) {
            setDefaultValues(advancedDefaultValues);
        }
    }
    const toggle = document.getElementById('enable_advanced');
    toggle.addEventListener('change', onChange)
    toggle.checked = false;
    onChange({target: toggle});

}

function setDefaultValues(defaultValues){
    for (const inputId in defaultValues) {
        const el = document.getElementById(inputId);
        if (el) {
            el.value = defaultValues[inputId]
            showVal({target: el})
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {

    const inputContainer = document.getElementById('input_container')
    for (const inputEl of inputContainer.getElementsByTagName('input')) {
        inputEl.addEventListener('change', onChange);
        inputEl.addEventListener('input', showVal);
    }
    

    setDefaultValues({...defaultValues, ...advancedDefaultValues});
    onUpdate();

    // Set up toggles
    initializeInformationToggles(inputContainer);
    initializeAdvancedToggles();
})